import type { Dish } from "@/types/dish"

// A small deterministic generator: the same day always shows the same dishes, the next day others
const seeded = (seedText: string) => {
  let seed = [...seedText].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Dishes someone loves that we haven't had since `sinceIso` (or never logged), a different
// handful each day, the most loved first in the draw.
export const forgottenFavourites = (
  dishes: readonly Dish[],
  lastEaten: Readonly<Record<string, string>>,
  sinceIso: string,
  todayIso: string,
  count: number,
): Dish[] => {
  const random = seeded(todayIso)
  return dishes
    .filter((d) => d.lovedBy.length > 0 && !((lastEaten[d.id] ?? "") >= sinceIso))
    .map((d) => ({ d, key: random() / d.lovedBy.length }))
    .sort((a, b) => a.key - b.key)
    .slice(0, count)
    .map(({ d }) => d)
}
