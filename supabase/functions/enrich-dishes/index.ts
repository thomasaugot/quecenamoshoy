import { Type } from "@google/genai"
import { requireUser } from "../_shared/auth.ts"
import { json, preflight } from "../_shared/cors.ts"
import { PROTEINS, TRAITS } from "../_shared/dish.ts"
import { missingEnv } from "../_shared/env.ts"
import { EQUIPMENT } from "../_shared/equipment.ts"
import { gemini, LIMITS, MAX_OUTPUT_TOKENS, TEXT_MODEL, THINKING } from "../_shared/gemini.ts"
import { takeAiCall } from "../_shared/rate-limit.ts"
import { LANGUAGES } from "../_shared/languages.ts"

// Sorts my dishes once (brief §3.3 "AI enriches each dish"): what each one IS — protein,
// traits, hot/cold, equipment, a short description — so goals, the roulette and the
// suggestions can reason about it. Only EMPTY fields are filled: what I set by hand stays.
// One Gemini call for the whole batch.

const BATCH = 80
const ALL_EQUIPMENT = Object.values(EQUIPMENT).flat() as string[]

type DishRow = {
  id: string; name: string; description: string | null; protein: string | null
  traits: string[]; temp: string | null; equipment: string[]
}
type Enriched = { id: string; protein: string; traits: string[]; temp: string; equipment: string[]; description: string }

const needsWork = (d: DishRow) => !d.protein || d.traits.length === 0 || !d.temp || d.equipment.length === 0 || !d.description

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    dishes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          protein: { type: Type.STRING, enum: [...PROTEINS] },
          traits: { type: Type.ARRAY, items: { type: Type.STRING, enum: [...TRAITS] } },
          temp: { type: Type.STRING, enum: ["hot", "cold"] },
          equipment: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_EQUIPMENT } },
          description: { type: Type.STRING },
        },
        required: ["id", "protein", "traits", "temp", "equipment", "description"],
      },
    },
  },
  required: ["dishes"],
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
  const language = typeof body?.language === "string" && body.language in LANGUAGES ? body.language as keyof typeof LANGUAGES : null
  if (!language) return json(req, { error: "invalid_input" }, 400)

  // My dishes (RLS), the ones with something missing
  const { data, error } = await user.client.from("dishes").select("id, name, description, protein, traits, temp, equipment").order("name")
  if (error) return json(req, { error: "query" }, 500)
  const todo = (data as DishRow[]).filter(needsWork).slice(0, BATCH)
  if (todo.length === 0) return json(req, { updated: 0, remaining: 0 })

  if (!(await takeAiCall(user.client, "enrich-dishes", LIMITS.enrichDishes))) return json(req, { error: "rate_limited" }, 429)

  try {
    const response = await gemini().models.generateContent({
      model: TEXT_MODEL,
      contents: `Classify each home-cooked dish below. For each, by its id:
- protein: the main protein (vegetarian = no meat/fish but may have eggs or dairy; vegan = no animal products).
- traits: all that apply, only from the list.
- temp: served hot or cold.
- equipment: what is usually needed to cook it at home, only from the list.
- description: one short appetising line in ${LANGUAGES[language]}, max 90 characters.
Dishes: ${JSON.stringify(todo.map((d) => ({ id: d.id, name: d.name, description: d.description })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS.enrichDishes,
        thinkingConfig: THINKING,
      },
    })
    const parsed = JSON.parse(response.text ?? "{}") as { dishes?: Enriched[] }
    const byId = new Map(todo.map((d) => [d.id, d]))
    let updated = 0
    for (const e of Array.isArray(parsed.dishes) ? parsed.dishes : []) {
      const d = byId.get(e.id)
      if (!d) continue   // never touch an id I didn't send
      const patch: Record<string, unknown> = {}
      if (!d.protein && (PROTEINS as readonly string[]).includes(e.protein)) patch.protein = e.protein
      if (d.traits.length === 0) patch.traits = [...new Set((e.traits ?? []).filter((t) => (TRAITS as readonly string[]).includes(t)))]
      if (!d.temp && (e.temp === "hot" || e.temp === "cold")) patch.temp = e.temp
      if (d.equipment.length === 0) patch.equipment = [...new Set((e.equipment ?? []).filter((x) => ALL_EQUIPMENT.includes(x)))]
      if (!d.description && typeof e.description === "string" && e.description.trim()) patch.description = e.description.trim().slice(0, 300)
      if (Object.keys(patch).length === 0) continue
      const { error: updateError } = await user.client.from("dishes").update(patch).eq("id", d.id)
      if (!updateError) updated++
    }
    const remaining = (data as DishRow[]).filter(needsWork).length - updated
    console.log(`enrich-dishes: sent ${todo.length}, updated ${updated}, remaining ${remaining}`)
    return json(req, { updated, remaining: Math.max(0, remaining) })
  } catch (err) {
    console.error("enrich-dishes failed", err instanceof Error ? err.message.slice(0, 120) : "unknown")
    return json(req, { error: "upstream" }, 502)
  }
})
