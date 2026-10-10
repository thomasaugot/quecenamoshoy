// The dish catalogues — keys only. SAME lists as src/constants/dish.ts (a Vitest test fails if
// they drift). The model may only answer with these keys.
export const PROTEINS = [
  "red_meat", "pork", "poultry", "fish", "seafood", "eggs", "vegetarian", "vegan",
] as const

export const TRAITS = [
  "vegetables", "legumes", "light", "fried", "pasta", "rice", "soup", "salad", "spicy", "oven", "comfort",
] as const
