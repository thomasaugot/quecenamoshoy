import type { DishProtein, DishTemp } from "@/types/database"

// What a dish IS, so eating goals can count it (brief §3.9). Labels: locales → catalogue.
export const PROTEINS = [
  "red_meat", "pork", "poultry", "fish", "seafood", "eggs", "vegetarian", "vegan",
] as const satisfies readonly DishProtein[]

export const TRAITS = [
  "vegetables", "legumes", "light", "fried", "pasta", "rice", "soup", "salad", "spicy", "oven", "comfort",
] as const

export const TEMPS = ["hot", "cold"] as const satisfies readonly DishTemp[]

// Mirrors the CHECKs on public.dishes
export const DISH_NAME_MAX = 120
export const DISH_DESCRIPTION_MAX = 2000

export const RECIPE_SERVINGS_MAX = 20
// Longest side of my own dish photos once resized (WebP, a few hundred KB)
export const DISH_PHOTO_MAX_SIDE = 1400
