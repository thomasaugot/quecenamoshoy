import type { Json } from "@/types/database"
import type { Ingredient, Recipe, RecipeDraft } from "@/types/recipe"

const SEPARATOR = " — "

// JSON from the database, never trusted as-is: only well-formed entries survive
export const parseIngredients = (value: Json): Ingredient[] =>
  (Array.isArray(value) ? value : []).flatMap((i) => {
    if (typeof i !== "object" || i === null || Array.isArray(i)) return []
    const item = typeof i.item === "string" ? i.item : ""
    const quantity = typeof i.quantity === "string" ? i.quantity : ""
    return item.trim() ? [{ item, quantity }] : []
  })

export const parseSteps = (value: Json): string[] =>
  (Array.isArray(value) ? value : []).flatMap((s) => (typeof s === "string" && s.trim() ? [s] : []))

export const toDraft = (r: Recipe): RecipeDraft => ({
  servings: r.servings,
  prepMinutes: r.prepMinutes,
  ingredientsText: r.ingredients.map((i) => (i.quantity ? `${i.quantity}${SEPARATOR}${i.item}` : i.item)).join("\n"),
  stepsText: r.steps.join("\n"),
})

// Writing one from scratch: sized for the household
export const blankDraft = (servings: number): RecipeDraft =>
  ({ servings, prepMinutes: null, ingredientsText: "", stepsText: "" })

// "200 g — harina" → { quantity: "200 g", item: "harina" }; a line without " — " is all item
export const ingredientsFromText = (text: string): Ingredient[] =>
  text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const at = line.indexOf(SEPARATOR.trim())
    return at > 0
      ? { quantity: line.slice(0, at).trim(), item: line.slice(at + 1).trim() }
      : { quantity: "", item: line }
  })

export const stepsFromText = (text: string): string[] =>
  text.split("\n").map((l) => l.trim().replace(/^\d+[.)]\s*/, "")).filter(Boolean)

// Only https links are imported (the Edge Function refuses anything else too)
export const isRecipeUrl = (text: string) => {
  try { return new URL(text.trim()).protocol === "https:" } catch { return false }
}

export const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, "") } catch { return url }
}

// A time written in a step ("cuire 20 min", "bake for 1 h 15", "15 minutes") → minutes, for a
// one-tap timer. The first time in the step; null when there is none or it's absurd.
export const stepMinutes = (step: string): number | null => {
  const text = step.toLowerCase()
  const hours = text.match(/(\d+)\s*(?:h|hr|hrs|heures?|horas?|hours?)\b\s*(\d+)?/)
  if (hours) {
    const total = Number(hours[1]) * 60 + Number(hours[2] ?? 0)
    return total > 0 && total <= 720 ? total : null
  }
  const minutes = text.match(/(\d+)\s*(?:min|mins|minutes?|minutos?|mn)\b/)
  const total = minutes ? Number(minutes[1]) : 0
  return total > 0 && total <= 720 ? total : null
}

export const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}
