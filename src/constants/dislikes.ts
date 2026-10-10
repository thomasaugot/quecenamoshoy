// Dislikes — a SOFT rule: avoided, or "sin cilantro" in the recipe (brief §3.8).
// Labels: locales → catalogue.dislike.
export const DISLIKES = [
  "coriander", "olives", "liver", "mushrooms", "onion", "garlic", "spicy",
  "blue_cheese", "anchovies", "peppers", "aubergine", "beetroot", "tripe", "raisins",
] as const

export type DislikeKey = (typeof DISLIKES)[number]
