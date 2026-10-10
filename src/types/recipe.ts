import type { RecipeSource } from "@/types/database"

export type Ingredient = { item: string; quantity: string }

export type Recipe = {
  servings: number
  prepMinutes: number | null
  goodForLeftovers: boolean
  equipment: string[]
  ingredients: Ingredient[]
  steps: string[]
  source: RecipeSource
  sourceUrl: string | null
  language: string | null      // null = unknown (older or imported without one)
}

// Editing by hand: one ingredient per line ("200 g — harina"), one step per line
export type RecipeDraft = { servings: number; prepMinutes: number | null; ingredientsText: string; stepsText: string }
