import type { Dish, DishFilter } from "@/types/dish"
import { normaliseText } from "@/utils/people"

// Search by name and description, accents and case ignored; then whose loves, what's in it,
// what it's like, hot or cold. An empty group does not filter.
export const filterDishes = (dishes: readonly Dish[], { query, personId, proteins, traits, temps }: DishFilter): Dish[] => {
  const q = normaliseText(query)
  return dishes.filter((d) =>
    (!personId || d.lovedBy.includes(personId)) &&
    (!q || normaliseText(`${d.name} ${d.description ?? ""} ${d.tags.join(" ")}`).includes(q)) &&
    (!proteins.length || d.proteins.some((x) => proteins.includes(x))) &&
    (!traits.length || traits.some((t) => d.traits.includes(t))) &&
    (!temps.length || (d.temp !== null && temps.includes(d.temp))))
}

export const activeFilterCount = ({ proteins, traits, temps }: Pick<DishFilter, "proteins" | "traits" | "temps">): number =>
  proteins.length + traits.length + temps.length

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

// Saved with my own words but nothing the app understands yet: worth an AI sort
export const needsSorting = (dish: Pick<Dish, "proteins" | "traits" | "tags">): boolean =>
  dish.tags.length > 0 && (dish.proteins.length === 0 || dish.traits.length === 0)

// Dishes the AI sort would still fill in (mirrors needsWork in supabase/functions/enrich-dishes)
export const unsortedDishes = (dishes: readonly Dish[]) =>
  dishes.filter((d) => d.proteins.length === 0 || d.traits.length === 0 || !d.temp || d.equipment.length === 0 || !d.description)
