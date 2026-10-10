import type { GoalDefinition } from "@/types/person"

// Eating goals — SOFT nudges, never blocks (brief §3.9). Labels: locales → catalogue.goal.
// limit = at most N a week, min = at least N a week. `counts` = which dishes count toward it
// (by dishes.protein / dishes.traits — constants/dish.ts).
export const GOALS = [
  { key: "limit_red_meat", kind: "limit", defaultPerWeek: 2, counts: { proteins: ["red_meat"] } },
  { key: "try_vegan", kind: "min", defaultPerWeek: 1, counts: { proteins: ["vegan"] } },
  { key: "more_fish", kind: "min", defaultPerWeek: 2, counts: { proteins: ["fish", "seafood"] } },
  { key: "more_vegetables", kind: "min", defaultPerWeek: 3, counts: { proteins: ["vegetarian", "vegan"], traits: ["vegetables", "salad"] } },
  { key: "more_legumes", kind: "min", defaultPerWeek: 1, counts: { traits: ["legumes"] } },
  { key: "less_fried", kind: "limit", defaultPerWeek: 1, counts: { traits: ["fried"] } },
  { key: "light_weekdays", kind: "min", defaultPerWeek: 3, counts: { traits: ["light", "salad", "soup"], weekdaysOnly: true } },
] as const satisfies readonly GoalDefinition[]

export type GoalKey = (typeof GOALS)[number]["key"]

export const PER_WEEK_MIN = 0
export const PER_WEEK_MAX = 7
