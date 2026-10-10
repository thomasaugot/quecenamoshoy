// Diets — treated like an allergy: a HARD rule (brief §3.8). Labels: locales → catalogue.diet.
export const DIETS = ["vegetarian", "vegan", "pescatarian", "no_pork", "no_red_meat", "no_alcohol"] as const

export type DietKey = (typeof DIETS)[number]

// What each diet rules out, by dish protein (a HARD rule, like an allergy)
export const DIET_EXCLUDED_PROTEINS: Record<string, readonly string[]> = {
  vegetarian: ["red_meat", "pork", "poultry", "fish", "seafood"],
  vegan: ["red_meat", "pork", "poultry", "fish", "seafood", "eggs"],
  pescatarian: ["red_meat", "pork", "poultry"],
  no_pork: ["pork"],
  no_red_meat: ["red_meat"],
}
