import { FunctionsHttpError } from "@supabase/supabase-js"
import type { Locale } from "@/config/i18n.config"
import { supabase } from "@/lib/supabase"
import type { Ingredient, Recipe } from "@/types/recipe"
import { functionErrorCode, RateLimitedError, RecipeImportError } from "@/utils/errors"
import { parseIngredients, parseSteps } from "@/utils/recipes"

export const getRecipe = async (dishId: string): Promise<Recipe | null> => {
  const { data, error } = await supabase.from("recipes")
    .select("servings, prep_minutes, good_for_leftovers, equipment, ingredients, steps, source, source_url")
    .eq("dish_id", dishId).maybeSingle()
  if (error) throw new Error(`recipe query failed: ${error.code}`)
  if (!data) return null
  return {
    servings: data.servings,
    prepMinutes: data.prep_minutes,
    goodForLeftovers: data.good_for_leftovers,
    equipment: data.equipment,
    ingredients: parseIngredients(data.ingredients),
    steps: parseSteps(data.steps),
    source: data.source,
    sourceUrl: data.source_url,
  }
}

// Gemini writes it for my kitchen and the people eating (Edge Function recipe), saved there
export const generateRecipe = async (input: { dishId: string; servings: number; diners: string[]; language: Locale }): Promise<void> => {
  const { error } = await supabase.functions.invoke("recipe", { body: input })
  if (error instanceof FunctionsHttpError && error.context.status === 429) throw new RateLimitedError("recipe")
  if (error) throw new Error(`recipe failed: ${await functionErrorCode(error)}`)
}

// Read from a recipe page I paste the link of (Edge Function import-recipe). With a dishId the
// recipe goes on that dish; without, a new dish (name, photo, recipe, my favourite) is created.
export const importRecipe = async (input: { dishId?: string; url: string }): Promise<string> => {
  const { data, error } = await supabase.functions.invoke<{ dishId: string }>("import-recipe", { body: input })
  if (error instanceof FunctionsHttpError && error.context.status === 429) throw new RateLimitedError("import-recipe")
  if (error instanceof FunctionsHttpError && error.context.status === 422) {
    const code = (await functionErrorCode(error)).split(" ")[1]
    throw new RecipeImportError(code === "no_recipe" ? "no_recipe" : "unreachable")
  }
  if (error || !data) throw new Error(`import failed: ${await functionErrorCode(error)}`)
  return data.dishId
}

// My own edits: the recipe becomes "mine"
export const saveRecipe = async ({ dishId, servings, prepMinutes, ingredients, steps }: {
  dishId: string; servings: number; prepMinutes: number | null; ingredients: Ingredient[]; steps: string[]
}): Promise<void> => {
  const { error } = await supabase.from("recipes").upsert({
    dish_id: dishId, servings, prep_minutes: prepMinutes, ingredients, steps, source: "mine", updated_at: new Date().toISOString(),
  }, { onConflict: "dish_id" })
  if (error) throw new Error(`recipe write failed: ${error.code}`)
}
