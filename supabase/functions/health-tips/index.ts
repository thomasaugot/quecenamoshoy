import { Type } from "@google/genai"
import { requireUser } from "../_shared/auth.ts"
import { json, preflight } from "../_shared/cors.ts"
import { missingEnv } from "../_shared/env.ts"
import { gemini, LIMITS, MAX_OUTPUT_TOKENS, TEXT_MODEL, THINKING } from "../_shared/gemini.ts"
import { LANGUAGES } from "../_shared/languages.ts"
import { takeAiCall } from "../_shared/rate-limit.ts"

// The month's figures (computed in the app: src/utils/health.ts) read back as three concrete
// changes, using dishes I already cook. Figures only: no names of people, no notes. General
// wellbeing, never medical advice. The figures come from the client, so each is checked.

const KEYS = new Set(["redMeat", "fish", "legumes", "veggie", "fried", "out", "variety"])
const KINDS = new Set(["max", "min", "share"])
const MAX_TIPS = 3
const MAX_DISHES = 60

type Figure = { key: string; kind: string; value: number; target: number; ok: boolean }
type Input = { language: keyof typeof LANGUAGES; dinners: number; weeks: number; unsorted: number; figures: Figure[] }

const num = (v: unknown, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max

const parseInput = (body: unknown): Input | null => {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  if (typeof b.language !== "string" || !(b.language in LANGUAGES)) return null
  if (!num(b.dinners, 400) || !num(b.weeks, 6) || !num(b.unsorted, 400)) return null
  if (!Array.isArray(b.figures) || b.figures.length > KEYS.size) return null
  const figures: Figure[] = []
  for (const f of b.figures as Record<string, unknown>[]) {
    if (typeof f !== "object" || f === null) return null
    if (typeof f.key !== "string" || !KEYS.has(f.key) || typeof f.kind !== "string" || !KINDS.has(f.kind)) return null
    if (!num(f.value, 50) || !num(f.target, 50) || typeof f.ok !== "boolean") return null
    figures.push({ key: f.key, kind: f.kind, value: f.value, target: f.target, ok: f.ok })
  }
  return { language: b.language as Input["language"], dinners: b.dinners, weeks: b.weeks, unsorted: b.unsorted, figures }
}

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    tips: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          why: { type: Type.STRING },
          dishes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "why", "dishes"],
      },
    },
  },
  required: ["summary", "tips"],
}

const MEANING: Record<string, string> = {
  redMeat: "dinners with red meat or pork per week",
  fish: "dinners with fish or seafood per week",
  legumes: "dinners with legumes per week",
  veggie: "vegetarian/vegan or vegetable-led dinners per week",
  fried: "fried dinners per week",
  out: "dinners out or takeaway per week",
  variety: "share of distinct dishes among home dinners (1 = never the same twice)",
}

const clip = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "")

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

  const input = parseInput(await req.json().catch(() => null))
  if (!input) return json(req, { error: "invalid_input" }, 400)

  // My dishes (RLS), so the tips name things I actually cook; diets so they never break one
  const [dishes, restrictions] = await Promise.all([
    user.client.from("dishes").select("name, proteins, traits").order("name").limit(MAX_DISHES),
    user.client.from("person_restrictions").select("kind, key").in("kind", ["diet", "allergy"]),
  ])
  if (dishes.error || restrictions.error) return json(req, { error: "query" }, 500)

  if (!(await takeAiCall(user.client, "health-tips", LIMITS.healthTips))) return json(req, { error: "rate_limited" }, 429)

  const figures = input.figures.map((f) =>
    `- ${MEANING[f.key]}: ${f.value} (guide: ${f.kind === "max" ? "at most" : "at least"} ${f.target}) → ${f.ok ? "fine" : "to improve"}`)
  try {
    const response = await gemini().models.generateContent({
      model: TEXT_MODEL,
      contents: `You help a household that logs its dinners eat a little better. This is general wellbeing guidance, not medical advice: no diagnoses, no supplements, no calorie counts, no moralising.
Their month: ${input.dinners} dinners over ${input.weeks} weeks${input.unsorted ? ` (${input.unsorted} dinners could not be read, say so if it matters)` : ""}.
${figures.join("\n")}
Their diets and allergies (never suggest anything against them): ${JSON.stringify((restrictions.data ?? []).map((r) => `${r.kind}:${r.key}`))}
Dishes they already cook: ${JSON.stringify((dishes.data ?? []).map((d) => ({ name: d.name, proteins: d.proteins, traits: d.traits })))}
Write in ${LANGUAGES[input.language]}, warm and direct, like a friend who cooks.
- summary: one sentence on how the month looks, naming its strongest point.
- tips: up to ${MAX_TIPS}, the most useful first, each about a figure marked "to improve" (if none, ways to keep it up). title: the change, concrete and short ("Swap one steak night for fish"). why: one sentence, with the figure in it. dishes: 1 to 3 dish names, from their dishes when one fits, else a simple new idea.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS.healthTips,
        thinkingConfig: THINKING,
      },
    })
    const parsed = JSON.parse(response.text ?? "{}") as { summary?: unknown; tips?: unknown }
    const tips = (Array.isArray(parsed.tips) ? parsed.tips : []).slice(0, MAX_TIPS).flatMap((t: Record<string, unknown>) => {
      const title = clip(t?.title, 120)
      const why = clip(t?.why, 300)
      const named = Array.isArray(t?.dishes) ? t.dishes.map((d: unknown) => clip(d, 80)).filter(Boolean).slice(0, 3) : []
      return title && why ? [{ title, why, dishes: named }] : []
    })
    return json(req, { summary: clip(parsed.summary, 300), tips })
  } catch (err) {
    console.error("health-tips failed", err instanceof Error ? err.message.slice(0, 120) : "unknown")
    return json(req, { error: "upstream" }, 502)
  }
})
