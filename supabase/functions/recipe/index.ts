import { Type } from "@google/genai"
import { requireUser } from "../_shared/auth.ts"
import { json, preflight } from "../_shared/cors.ts"
import { missingEnv } from "../_shared/env.ts"
import { EQUIPMENT } from "../_shared/equipment.ts"
import { gemini, LIMITS, MAX_OUTPUT_TOKENS, TEXT_MODEL, THINKING } from "../_shared/gemini.ts"
import { takeAiCall } from "../_shared/rate-limit.ts"

// A recipe for one of my dishes (brief §3.3, §4.3): written for MY kitchen (only equipment I
// have), for the people eating (allergies never, dislikes avoided — "sin cilantro"), scaled to
// the servings. Saved to `recipes` (one per dish), so it is generated once, then edited by hand.

const LANGUAGES = { es: "Spanish", en: "English", fr: "French" } as const
const ALL_EQUIPMENT = Object.values(EQUIPMENT).flat() as string[]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const NO_MATCH = "00000000-0000-0000-0000-000000000000"

type RecipeOut = { servings: number; prepMinutes: number; goodForLeftovers: boolean; equipment: string[]; ingredients: { item: string; quantity: string }[]; steps: string[] }

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    servings: { type: Type.INTEGER },
    prepMinutes: { type: Type.INTEGER },
    goodForLeftovers: { type: Type.BOOLEAN },
    equipment: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_EQUIPMENT } },
    ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: Type.STRING }, quantity: { type: Type.STRING } }, required: ["item", "quantity"] } },
    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["servings", "prepMinutes", "goodForLeftovers", "equipment", "ingredients", "steps"],
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req)
  if (req.method !== "POST") return json(req, { error: "method" }, 405)
  const missing = missingEnv()
  if (missing.length) {
    console.error("config missing:", missing.join(", "))
    return json(req, { error: "server_config" }, 500)
  }
  const user = await requireUser(req)
  if (!user) return json(req, { error: "unauthorized" }, 401)

  const body = await req.json().catch(() => null)
  const dishId = typeof body?.dishId === "string" && UUID.test(body.dishId) ? body.dishId : null
  const servings = Number.isInteger(body?.servings) && body.servings >= 1 && body.servings <= 20 ? body.servings as number : null
  const language = typeof body?.language === "string" && body.language in LANGUAGES ? body.language as keyof typeof LANGUAGES : null
  const diners = Array.isArray(body?.diners) && body.diners.length <= 20 && body.diners.every((d: unknown) => typeof d === "string" && UUID.test(d)) ? body.diners as string[] : null
  if (!dishId || !servings || !language || !diners) return json(req, { error: "invalid_input" }, 400)

  // The dish must be mine (RLS): someone else's id finds nothing
  const { data: dish, error: dishError } = await user.client.from("dishes").select("id, name, description").eq("id", dishId).maybeSingle()
  if (dishError) return json(req, { error: "query" }, 500)
  if (!dish) return json(req, { error: "not_found" }, 404)

  if (!(await takeAiCall(user.client, "recipe", LIMITS.recipe))) return json(req, { error: "rate_limited" }, 429)

  const [kitchen, people] = await Promise.all([
    user.client.from("kitchen_items").select("key, label").eq("location", "home"),
    user.client.from("people").select("person_restrictions(kind, key, label)").in("id", diners.length ? diners : [NO_MATCH]),
  ])
  if (kitchen.error || people.error) return json(req, { error: "query" }, 500)
  const owned = kitchen.data ?? []
  const restrictions = (people.data ?? []).flatMap((p) => (p.person_restrictions ?? []) as { kind: string; key: string; label: string | null }[])
  const by = (kind: string) => [...new Set(restrictions.filter((r) => r.kind === kind).map((r) => r.label ?? r.key))]

  try {
    const response = await gemini().models.generateContent({
      model: TEXT_MODEL,
      contents: `Write a home-cooking recipe for "${dish.name}"${dish.description ? ` (${dish.description})` : ""}, in ${LANGUAGES[language]}.
- Servings: exactly ${servings}. Quantities for ${servings}, metric units.
- Kitchen: ${owned.length ? `ONLY this equipment: ${owned.map((o) => o.label ?? o.key).join(", ")}. If the classic method needs something else, adapt it (e.g. oven instead of air fryer).` : "an ordinary home kitchen."}
- NEVER use (allergies / diets of the people eating): ${[...by("allergy"), ...by("diet")].join(", ") || "nothing to avoid"}.
- Avoid if possible, or say how to leave it out: ${by("dislike").join(", ") || "nothing"}.
- equipment: what this recipe uses, keys from the list only.
- steps: clear, short, in order. No numbering in the text.`,
      config: { responseMimeType: "application/json", responseSchema: SCHEMA, maxOutputTokens: MAX_OUTPUT_TOKENS.recipe, thinkingConfig: { ...THINKING } },
    })
    const r = JSON.parse(response.text ?? "{}") as Partial<RecipeOut>
    const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : [])
      .filter((i) => typeof i?.item === "string" && i.item.trim())
      .slice(0, 40).map((i) => ({ item: String(i.item).slice(0, 120), quantity: String(i.quantity ?? "").slice(0, 60) }))
    const steps = (Array.isArray(r.steps) ? r.steps : []).map((s) => String(s).slice(0, 600)).filter((s) => s.trim()).slice(0, 30)
    if (!ingredients.length || !steps.length) return json(req, { error: "upstream" }, 502)
    const recipe = {
      dish_id: dish.id,
      servings,
      prep_minutes: Math.min(1440, Math.max(1, Math.round(Number(r.prepMinutes) || 30))),
      good_for_leftovers: !!r.goodForLeftovers,
      equipment: [...new Set((r.equipment ?? []).filter((e) => ALL_EQUIPMENT.includes(e)))],
      ingredients,
      steps,
      source: "ai",
      source_url: null,
      updated_at: new Date().toISOString(),
    }
    const { error: saveError } = await user.client.from("recipes").upsert(recipe, { onConflict: "dish_id" })
    if (saveError) return json(req, { error: "save" }, 500)
    return json(req, { ok: true })
  } catch (err) {
    console.error("recipe failed", err instanceof Error ? err.message.slice(0, 120) : "unknown")
    return json(req, { error: "upstream" }, 502)
  }
})
