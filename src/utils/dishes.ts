import type { Dish, DishFilter } from "@/types/dish"
import { normaliseText } from "@/utils/people"

// Search by name and description, accents and case ignored; optionally only one person's loves
export const filterDishes = (dishes: readonly Dish[], { query, personId }: DishFilter): Dish[] => {
  const q = normaliseText(query)
  return dishes.filter((d) =>
    (!personId || d.lovedBy.includes(personId)) &&
    (!q || normaliseText(`${d.name} ${d.description ?? ""}`).includes(q)))
}

// A dish loved by several of us ranks higher (brief §3.8), then alphabetical
export const sortByLove = (dishes: readonly Dish[]): Dish[] =>
  [...dishes].sort((a, b) => b.lovedBy.length - a.lovedBy.length || a.name.localeCompare(b.name))

export const dishNameError = (name: string, max: number): "required" | "tooLong" | null => {
  const trimmed = name.trim()
  if (!trimmed) return "required"
  if (trimmed.length > max) return "tooLong"
  return null
}

export const hasExactName = (dishes: readonly Dish[], name: string): boolean =>
  dishes.some((d) => normaliseText(d.name) === normaliseText(name))

// Dishes the AI sort would still fill in (mirrors needsWork in supabase/functions/enrich-dishes)
export const unsortedDishes = (dishes: readonly Dish[]) =>
  dishes.filter((d) => !d.protein || d.traits.length === 0 || !d.temp || d.equipment.length === 0 || !d.description)
