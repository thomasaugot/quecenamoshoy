import { requireUser } from "../_shared/auth.ts"
import { json, preflight } from "../_shared/cors.ts"
import { LIMITS } from "../_shared/gemini.ts"
import { takeAiCall } from "../_shared/rate-limit.ts"

// Import a recipe from a link I paste (Marmiton, etc.) — no AI, no scraping of a site: one
// page I chose, read once. Recipe sites embed the recipe as schema.org JSON-LD; that is read.
// With a dishId: the recipe goes on that dish. Without: a NEW dish is created from the page
// (name, description, photo credited to the site), marked as my favourite.
// This function fetches a URL from the internet, so it is guarded against SSRF: https only,
// public hostnames only (no IPs, no localhost, private ranges refused after DNS), every
// redirect re-checked, 8 s timeout, 3 MB cap.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES = 3_000_000
const MAX_IMAGE_BYTES = 5_000_000
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
const TIMEOUT_MS = 8_000
const MAX_REDIRECTS = 3

const isPrivateIp = (ip: string) =>
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) ||
  ip === "::1" || /^f[cd]/i.test(ip) || /^fe80/i.test(ip) || ip.startsWith("::ffff:")

const safeUrl = async (raw: string): Promise<URL | null> => {
  let url: URL
  try { url = new URL(raw) } catch { return null }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null
  const host = url.hostname
  if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || /^[\d.]+$/.test(host) || host.includes(":")) return null
  const records = await Promise.all([Deno.resolveDns(host, "A").catch(() => []), Deno.resolveDns(host, "AAAA").catch(() => [])])
  const ips = records.flat()
  if (!ips.length || ips.some(isPrivateIp)) return null
  return url
}

// Every hop re-checked, size capped while streaming
const fetchSafe = async (start: string, accepts: (contentType: string) => boolean, maxBytes: number) => {
  let current = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await safeUrl(current)
    if (!url) return null
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": "quecenamoshoy-recipe-import/1.0" } })
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location")
      await res.body?.cancel()
      if (!next) return null
      current = new URL(next, url).toString()
      continue
    }
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? ""
    if (!res.ok || !accepts(contentType)) { await res.body?.cancel(); return null }
    const reader = res.body?.getReader()
    if (!reader) return null
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > maxBytes) { await reader.cancel(); return null }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const c of chunks) { bytes.set(c, offset); offset += c.length }
    return { bytes, contentType, finalUrl: url.toString() }
  }
  return null
}

type Json = unknown
const asArray = (v: Json): Json[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v])
const typeIs = (node: Json, t: string) => asArray((node as { "@type"?: Json })?.["@type"]).includes(t)

const findRecipe = (html: string): Record<string, Json> | null => {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, text] of blocks) {
    let data: Json
    try { data = JSON.parse(text ?? "") } catch { continue }
    const queue = [...asArray(data)]
    while (queue.length) {
      const node = queue.shift() as Record<string, Json> | undefined
      if (!node || typeof node !== "object") continue
      if (typeIs(node, "Recipe")) return node
      queue.push(...asArray(node["@graph"]))
    }
  }
  return null
}

const decode = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/\s+/g, " ").trim()

const stepsOf = (v: Json): string[] =>
  asArray(v).flatMap((s) => {
    if (typeof s === "string") return [decode(s)]
    const node = s as Record<string, Json>
    if (typeIs(node, "HowToSection")) return stepsOf(node.itemListElement)
    return typeof node?.text === "string" ? [decode(node.text)] : []
  }).filter(Boolean)

// "PT1H30M" → 90
const minutesOf = (iso: Json) => {
  const m = typeof iso === "string" ? iso.match(/^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/) : null
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) || null : null
}

const imageUrlOf = (v: Json): string | null => {
  for (const i of asArray(v)) {
    if (typeof i === "string") return i
    const url = (i as { url?: Json })?.url
    if (typeof url === "string") return url
  }
  return null
}

const servingsOf = (v: Json) => {
  const first = asArray(v).map(String).find((s) => /\d/.test(s))
  const n = first ? Number(first.match(/\d+/)?.[0]) : NaN
  return Number.isInteger(n) && n >= 1 && n <= 50 ? n : 4
}

// "200 g de farine" → { quantity: "200 g", item: "de farine" }: best effort, the text is kept whole
const ingredientOf = (line: string) => {
  const m = line.match(/^([\d.,/½¼¾]+\s*(?:[a-zA-Zàéèêç.]{1,12}\.?)?)\s+(.*)$/)
  return m && m[2] ? { quantity: m[1]?.trim() ?? "", item: m[2].trim() } : { quantity: "", item: line }
}

type Client = NonNullable<Awaited<ReturnType<typeof requireUser>>>["client"]

// A new dish from the page: name, description, the page's photo (credited), my favourite
const createDishFrom = async (client: Client, userId: string, recipe: Record<string, Json>, pageUrl: string): Promise<string | null> => {
  const name = typeof recipe.name === "string" ? decode(recipe.name).slice(0, 120) : ""
  if (!name) return null
  const description = typeof recipe.description === "string" ? decode(recipe.description).slice(0, 300) || null : null
  const { data: dish, error } = await client.from("dishes").insert({ name, description }).select("id").single()
  if (error || !dish) return null

  const imageUrl = imageUrlOf(recipe.image)
  if (imageUrl) {
    const image = await fetchSafe(new URL(imageUrl, pageUrl).toString(), (ct) => ct in IMAGE_TYPES, MAX_IMAGE_BYTES).catch(() => null)
    if (image) {
      const path = `${userId}/${dish.id}.${IMAGE_TYPES[image.contentType]}`
      const { error: uploadError } = await client.storage.from("dish-images").upload(path, image.bytes, { contentType: image.contentType, upsert: true })
      if (!uploadError) await client.from("dishes").update({ image_path: path, image_credit: new URL(pageUrl).hostname.replace(/^www\./, "") }).eq("id", dish.id)
    }
  }

  const { data: me } = await client.from("people").select("id").eq("is_me", true).maybeSingle()
  if (me) await client.from("dish_favourites").insert({ person_id: me.id, dish_id: dish.id })
  return dish.id
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req)
  if (req.method !== "POST") return json(req, { error: "method" }, 405)
  const user = await requireUser(req)
  if (!user) return json(req, { error: "unauthorized" }, 401)

  const body = await req.json().catch(() => null)
  const givenDishId = body?.dishId === undefined || body?.dishId === null ? null
    : typeof body.dishId === "string" && UUID.test(body.dishId) ? body.dishId as string : "invalid"
  const url = typeof body?.url === "string" && body.url.length <= 500 ? body.url.trim() : null
  if (givenDishId === "invalid" || !url) return json(req, { error: "invalid_input" }, 400)

  if (givenDishId) {
    const { data: dish, error: dishError } = await user.client.from("dishes").select("id").eq("id", givenDishId).maybeSingle()
    if (dishError) return json(req, { error: "query" }, 500)
    if (!dish) return json(req, { error: "not_found" }, 404)
  }

  if (!(await takeAiCall(user.client, "import-recipe", LIMITS.importRecipe))) return json(req, { error: "rate_limited" }, 429)

  try {
    const fetched = await fetchSafe(url, (ct) => ct === "text/html", MAX_BYTES)
    if (!fetched) return json(req, { error: "unreachable" }, 422)
    const page = { html: new TextDecoder().decode(fetched.bytes), finalUrl: fetched.finalUrl }
    const recipe = findRecipe(page.html)
    if (!recipe) return json(req, { error: "no_recipe" }, 422)
    const ingredients = asArray(recipe.recipeIngredient).map((i) => decode(String(i))).filter(Boolean).slice(0, 40).map(ingredientOf)
    const steps = stepsOf(recipe.recipeInstructions).slice(0, 30).map((s) => s.slice(0, 600))
    if (!ingredients.length || !steps.length) return json(req, { error: "no_recipe" }, 422)
    const dishId = givenDishId ?? (await createDishFrom(user.client, user.userId, recipe, page.finalUrl))
    if (!dishId) return json(req, { error: "no_recipe" }, 422)
    const { error: saveError } = await user.client.from("recipes").upsert({
      dish_id: dishId,
      servings: servingsOf(recipe.recipeYield),
      prep_minutes: minutesOf(recipe.totalTime) ?? minutesOf(recipe.prepTime),
      good_for_leftovers: false,
      equipment: [],
      ingredients,
      steps,
      source: "imported",
      source_url: page.finalUrl.slice(0, 500),
      updated_at: new Date().toISOString(),
    }, { onConflict: "dish_id" })
    if (saveError) return json(req, { error: "save" }, 500)
    return json(req, { dishId })
  } catch (err) {
    console.error("import-recipe failed", err instanceof Error ? err.name : "unknown")
    return json(req, { error: "unreachable" }, 422)
  }
})
