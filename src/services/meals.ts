import { supabase } from "@/lib/supabase"
import { signedImageUrls } from "@/services/storage"
import type { CountedMeal, Meal, MealInput, RecentMeal } from "@/types/meal"
import { portions } from "@/utils/meals"

export const MEALS_PAGE_SIZE = 30

// Meals eaten on or after `sinceIso`, newest first, with their dish. RLS scopes them to me.
export const listRecentMeals = async (sinceIso: string): Promise<RecentMeal[]> => {
  const { data, error } = await supabase
    .from("meals")
    .select("id, eaten_on, dish_id, dishes ( name, image_path )")
    .gte("eaten_on", sinceIso)
    .order("eaten_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12)
  if (error) throw new Error(`recent meals query failed: ${error.code}`)

  const rows = data ?? []
  const urls = await signedImageUrls(rows.flatMap((r) => (r.dishes?.image_path ? [r.dishes.image_path] : [])))
  return rows.map((r) => ({
    id: r.id,
    eatenOn: r.eaten_on,
    dishId: r.dish_id,
    dishName: r.dishes?.name ?? "",
    imageUrl: r.dishes?.image_path ? urls.get(r.dishes.image_path) ?? null : null,
  }))
}

// The whole history, newest first, one page at a time
export const listMeals = async (page: number): Promise<Meal[]> => {
  const from = page * MEALS_PAGE_SIZE
  const { data, error } = await supabase
    .from("meals")
    .select("id, eaten_on, dish_id, rating, note, guests, location, with_leftovers, dishes ( name, image_path ), meal_diners ( person_id )")
    .order("eaten_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + MEALS_PAGE_SIZE - 1)
  if (error) throw new Error(`meals query failed: ${error.code}`)

  const urls = await signedImageUrls(data.flatMap((r) => (r.dishes?.image_path ? [r.dishes.image_path] : [])))
  return data.map((r) => ({
    id: r.id,
    eatenOn: r.eaten_on,
    dishId: r.dish_id,
    dishName: r.dishes?.name ?? "",
    imageUrl: r.dishes?.image_path ? urls.get(r.dishes.image_path) ?? null : null,
    rating: r.rating,
    note: r.note,
    guests: r.guests,
    location: r.location,
    withLeftovers: r.with_leftovers,
    diners: r.meal_diners.map((d) => d.person_id),
  }))
}

// What the eating goals count: dinners since `sinceIso` with what their dish is
export const listCountedMeals = async (sinceIso: string): Promise<CountedMeal[]> => {
  const { data, error } = await supabase
    .from("meals")
    .select("eaten_on, dish_id, dishes ( protein, traits ), meal_diners ( person_id )")
    .gte("eaten_on", sinceIso)
  if (error) throw new Error(`counted meals query failed: ${error.code}`)
  return data.map((r) => ({
    dishId: r.dish_id,
    eatenOn: r.eaten_on,
    protein: r.dishes?.protein ?? null,
    traits: r.dishes?.traits ?? [],
    diners: r.meal_diners.map((d) => d.person_id),
  }))
}

// A dish typed in the log form that doesn't exist yet is created first
const resolveDishId = async ({ dishId, newDishName }: MealInput): Promise<string> => {
  if (dishId) return dishId
  if (!newDishName) throw new Error("meal without a dish")
  const { data, error } = await supabase.from("dishes").insert({ name: newDishName }).select("id").single()
  if (error) throw new Error(`create dish failed: ${error.code}`)
  return data.id
}

const columns = (input: MealInput, dishId: string) => ({
  dish_id: dishId,
  eaten_on: input.eatenOn,
  people: portions(input.diners, input.guests),
  guests: input.guests,
  location: input.location,
  rating: input.rating,
  note: input.note,
  with_leftovers: input.withLeftovers,
})

const writeDiners = async (mealId: string, diners: string[]) => {
  const { error: removeError } = await supabase.from("meal_diners").delete().eq("meal_id", mealId)
  if (removeError) throw new Error(`diners write failed: ${removeError.code}`)
  if (!diners.length) return
  const { error } = await supabase.from("meal_diners").insert(diners.map((personId) => ({ meal_id: mealId, person_id: personId })))
  if (error) throw new Error(`diners write failed: ${error.code}`)
}

export const createMeal = async (input: MealInput): Promise<void> => {
  const dishId = await resolveDishId(input)
  const { data, error } = await supabase.from("meals").insert(columns(input, dishId)).select("id").single()
  if (error) throw new Error(`create meal failed: ${error.code}`)
  await writeDiners(data.id, input.diners)
}

export const updateMeal = async ({ id, input }: { id: string; input: MealInput }): Promise<void> => {
  const dishId = await resolveDishId(input)
  const { error } = await supabase.from("meals").update(columns(input, dishId)).eq("id", id)
  if (error) throw new Error(`update meal failed: ${error.code}`)
  await writeDiners(id, input.diners)
}

export const deleteMeal = async (id: string): Promise<void> => {
  const { error } = await supabase.from("meals").delete().eq("id", id)
  if (error) throw new Error(`delete meal failed: ${error.code}`)
}

// When each dish was last eaten (dish id → YYYY-MM-DD), from the last year of history
export const listLastEaten = async (sinceIso: string): Promise<Record<string, string>> => {
  const { data, error } = await supabase.from("meals").select("dish_id, eaten_on")
    .gte("eaten_on", sinceIso).order("eaten_on", { ascending: false }).limit(1000)
  if (error) throw new Error(`last eaten query failed: ${error.code}`)
  const last: Record<string, string> = {}
  for (const r of data) last[r.dish_id] ??= r.eaten_on
  return last
}
