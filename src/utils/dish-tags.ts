import { DISH_TAG_MAX, PROTEINS, TRAITS } from "@/constants/dish"
import type { DishInput, TagOption } from "@/types/dish"
import { normaliseText } from "@/utils/people"

type Tagged = Pick<DishInput, "proteins" | "traits" | "tags">
type Label = (group: "protein" | "trait", key: string) => string

// Everything the field can offer: the catalogue, then my own words already used on other dishes
export const tagOptions = (label: Label, usedTags: readonly string[]): TagOption[] => [
  ...PROTEINS.map((key) => ({ kind: "protein" as const, key, label: label("protein", key) })),
  ...TRAITS.map((key) => ({ kind: "trait" as const, key, label: label("trait", key) })),
  ...[...new Set(usedTags)].map((key) => ({ kind: "custom" as const, key, label: key })),
]

export const selectedTags = (dish: Tagged, label: Label): TagOption[] => [
  ...dish.proteins.map((key) => ({ kind: "protein" as const, key, label: label("protein", key) })),
  ...dish.traits.map((key) => ({ kind: "trait" as const, key, label: label("trait", key) })),
  ...dish.tags.map((key) => ({ kind: "custom" as const, key, label: key })),
]

const isSelected = (dish: Tagged, o: TagOption) =>
  o.kind === "protein" ? dish.proteins.some((p) => p === o.key)
    : o.kind === "trait" ? dish.traits.includes(o.key)
      : dish.tags.some((t) => normaliseText(t) === normaliseText(o.key))

// Accents and case ignored; words that start with what I typed come first
export const suggestTags = (options: readonly TagOption[], dish: Tagged, query: string, max: number): TagOption[] => {
  const q = normaliseText(query)
  if (!q) return []
  return options
    .filter((o) => !isSelected(dish, o) && normaliseText(o.label).includes(q))
    .sort((a, b) => Number(normaliseText(b.label).startsWith(q)) - Number(normaliseText(a.label).startsWith(q)))
    .slice(0, max)
}

// What I typed, as my own word — unless it is exactly a word the field already offers
export const customTag = (options: readonly TagOption[], query: string): string | null => {
  const text = query.trim().replace(/\s+/g, " ").slice(0, DISH_TAG_MAX)
  if (!text) return null
  return options.some((o) => normaliseText(o.label) === normaliseText(text)) ? null : text
}

export const addTag = <T extends Tagged>(dish: T, o: TagOption): T => {
  if (isSelected(dish, o)) return dish
  if (o.kind === "protein") return { ...dish, proteins: [...dish.proteins, o.key as T["proteins"][number]] }
  if (o.kind === "trait") return { ...dish, traits: [...dish.traits, o.key] }
  return { ...dish, tags: [...dish.tags, o.key] }
}

export const removeTag = <T extends Tagged>(dish: T, o: TagOption): T =>
  o.kind === "protein" ? { ...dish, proteins: dish.proteins.filter((p) => p !== o.key) }
    : o.kind === "trait" ? { ...dish, traits: dish.traits.filter((t) => t !== o.key) }
      : { ...dish, tags: dish.tags.filter((t) => t !== o.key) }
