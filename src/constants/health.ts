import type { HealthKey, HealthKind } from "@/types/health"

// General adult guidance, read per DINNER (one meal a day logged here), rounded to what a
// home cook can act on: red meat incl. pork ≤ 3 a week (WCRF: ≤ 350–500 g cooked), fish twice
// a week (EFSA / national guides, one oily), legumes at least twice (ES / FR guides), plants
// often, fried and takeaway rarely, and a varied plate. Not medical advice: the page says so.
export const HEALTH_TARGETS: readonly { key: HealthKey; kind: HealthKind; target: number }[] = [
  { key: "redMeat", kind: "max", target: 3 },
  { key: "fish", kind: "min", target: 2 },
  { key: "legumes", kind: "min", target: 2 },
  { key: "veggie", kind: "min", target: 3 },
  { key: "fried", kind: "max", target: 1 },
  { key: "out", kind: "max", target: 2 },
  { key: "variety", kind: "share", target: 0.6 },
]

export const RED_MEAT = ["red_meat", "pork"]
export const FISH = ["fish", "seafood"]
export const PLANT_PROTEINS = ["vegetarian", "vegan"]
export const VEGGIE_TRAITS = ["vegetables", "salad"]

// Below this, a month says nothing yet
export const HEALTH_MIN_DINNERS = 5
