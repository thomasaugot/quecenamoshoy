import { supabase } from "@/lib/supabase"
import { signedImageUrls, uploadMealPhoto } from "@/services/storage"
import type { CountedMeal, DishNote, Meal, MealInput, RecapMeal, RecentMeal, UnratedMeal } from "@/types/meal"
import { portions } from "@/utils/meals"

export const MEALS_PAGE_SIZE = 30

// The dinner's own photo first, else its dish's
const photoPath = (r: { image_path: string | null; dishes: { image_path: string | null } | null }) =>
  r.image_path ?? r.dishes?.image_path ?? null

// Meals eaten on or after `sinceIso`, newest first, with their dish. RLS scopes them to me.
export const listRecentMeals = async (sinceIso: string): Promise<RecentMeal[]> => {
  const { data, error } = await supabase
    .from("meals")
    .select("id, eaten_on, dish_id, eaten_out, place, image_path, dish_label, dishes ( name, image_path )")
    .gte("eaten_on", sinceIso)
    .order("eaten_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12)
  if (error) throw new Error(`recent meals query failed: ${error.code}`)

  const rows = data ?? []
  const urls = await signedImageUrls(rows.flatMap((r) => { const p = photoPath(r); return p ? [p] : [] }))
  return rows.map((r) => ({
    id: r.id,
    eatenOn: r.eaten_on,
    dishId: r.dish_id,
    dishName: r.dishes?.name ?? r.dish_label ?? "",
    imageUrl: urls.get(photoPath(r) ?? "") ?? null,
    eatenOut: r.eaten_out,
    place: r.place,
  }))
}

// The whole history, newest first, one page at a time
export const listMeals = async (page: number): Promise<Meal[]> => {
  const from = page * MEALS_PAGE_SIZE
  const { data, error } = await supabase
    .from("meals")
    .select("id, eaten_on, dish_id, eaten_out, place, image_path, dish_label, rating, note, guests, location, with_leftovers, dishes ( name, image_path ), meal_diners ( person_id )")
    .order("eaten_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + MEALS_PAGE_SIZE - 1)
  if (error) throw new Error(`meals query failed: ${error.code}`)

  const urls = await signedImageUrls(data.flatMap((r) => { const p = photoPath(r); return p ? [p] : [] }))
  return data.map((r) => ({
    id: r.id,
    eatenOn: r.eaten_on,
    dishId: r.dish_id,
    dishName: r.dishes?.name ?? r.dish_label ?? "",
    imageUrl: urls.get(photoPath(r) ?? "") ?? null,
    eatenOut: r.eaten_out,
    place: r.place,
    dishLabel: r.dish_label,
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
    .select("eaten_on, dish_id, dishes ( proteins, traits ), meal_diners ( person_id )")
    .gte("eaten_on", sinceIso)
  if (error) throw new Error(`counted meals query failed: ${error.code}`)
  return data.map((r) => ({
    dishId: r.dish_id,
    eatenOn: r.eaten_on,
    proteins: r.dishes?.proteins ?? [],
    traits: r.dishes?.traits ?? [],
    diners: r.meal_diners.map((d) => d.person_id),
  }))
}

// A dish typed in the log form that doesn't exist yet is created first. Eaten out, no dish at all
// is fine (the place stands for it).
const resolveDishId = async ({ dishId, newDishName, eatenOut }: MealInput): Promise<string | null> => {
  if (dishId) return dishId
  if (!newDishName) {
    if (eatenOut) return null
    throw new Error("meal without a dish")
  }
  const { data, error } = await supabase.from("dishes").insert({ name: newDishName }).select("id").single()
  if (error) throw new Error(`create dish failed: ${error.code}`)
  return data.id
}

const columns = (input: MealInput, dishId: string | null) => ({
  dish_id: dishId,
  eaten_out: input.eatenOut,
  place: input.eatenOut ? input.place?.trim().slice(0, 120) || null : null,
  dish_label: input.eatenOut ? input.dishLabel?.trim().slice(0, 120) || null : null,
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

// The photo goes up once the dinner exists (its id names the file); the user comes from the session
const savePhoto = async (mealId: string, photo: Blob | null | undefined) => {
  if (!photo) return
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error("no session for the meal photo")
  await uploadMealPhoto({ userId: data.user.id, mealId, photo })
}

export const createMeal = async (input: MealInput): Promise<void> => {
  const dishId = await resolveDishId(input)
  const { data, error } = await supabase.from("meals").insert(columns(input, dishId)).select("id").single()
  if (error) throw new Error(`create meal failed: ${error.code}`)
  await writeDiners(data.id, input.diners)
  await savePhoto(data.id, input.photo)
}

export const updateMeal = async ({ id, input }: { id: string; input: MealInput }): Promise<void> => {
  const dishId = await resolveDishId(input)
  const { error } = await supabase.from("meals").update(columns(input, dishId)).eq("id", id)
  if (error) throw new Error(`update meal failed: ${error.code}`)
  await writeDiners(id, input.diners)
  await savePhoto(id, input.photo)
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
  for (const r of data) if (r.dish_id) last[r.dish_id] ??= r.eaten_on
  return last
}

// The times we ate this dish and left a note or a rating, newest first
export const listDishNotes = async (dishId: string, limit: number): Promise<DishNote[]> => {
  const { data, error } = await supabase.from("meals").select("id, eaten_on, rating, note")
    .eq("dish_id", dishId).or("note.not.is.null,rating.not.is.null")
    .order("eaten_on", { ascending: false }).limit(limit)
  if (error) throw new Error(`dish notes query failed: ${error.code}`)
  return data.map((m) => ({ id: m.id, eatenOn: m.eaten_on, rating: m.rating, note: m.note }))
}

// The most recent dinner between `fromIso` and `toIso` that has no rating yet
export const getUnratedMeal = async (fromIso: string, toIso: string): Promise<UnratedMeal | null> => {
  const { data, error } = await supabase.from("meals").select("id, eaten_on, eaten_out, place, image_path, dish_label, dishes ( name, image_path )")
    .is("rating", null).gte("eaten_on", fromIso).lte("eaten_on", toIso)
    .order("eaten_on", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error(`unrated meal query failed: ${error.code}`)
  if (!data) return null
  const path = photoPath(data)
  const urls = await signedImageUrls(path ? [path] : [])
  return {
    id: data.id, eatenOn: data.eaten_on, dishName: data.dishes?.name ?? data.dish_label ?? "",
    imageUrl: path ? urls.get(path) ?? null : null, eatenOut: data.eaten_out,
  }
}

export const rateMeal = async ({ id, rating, note }: { id: string; rating: number; note: string | null }): Promise<void> => {
  const { error } = await supabase.from("meals").update({ rating, ...(note ? { note } : {}) }).eq("id", id)
  if (error) throw new Error(`rate meal failed: ${error.code}`)
}

// Every dinner of a month [fromIso, toIso], each flagged when it was the dish's first time ever
export const listRecapMeals = async (fromIso: string, toIso: string): Promise<RecapMeal[]> => {
  const { data, error } = await supabase.from("meals")
    .select("dish_id, eaten_on, rating, eaten_out, dishes ( name, image_path, proteins, traits )")
    .gte("eaten_on", fromIso).lte("eaten_on", toIso).order("eaten_on")
  if (error) throw new Error(`recap query failed: ${error.code}`)
  const dishIds = [...new Set(data.flatMap((m) => (m.dish_id ? [m.dish_id] : [])))]
  const before = dishIds.length
    ? await supabase.from("meals").select("dish_id").lt("eaten_on", fromIso).in("dish_id", dishIds)
    : { data: [], error: null }
  if (before.error) throw new Error(`recap history query failed: ${before.error.code}`)
  const eatenBefore = new Set(before.data.map((m) => m.dish_id))
  const urls = await signedImageUrls([...new Set(data.flatMap((m) => (m.dishes?.image_path ? [m.dishes.image_path] : [])))])
  const firstSeen = new Set<string>()
  return data.map((m) => {
    // a dinner out with no dish of mine is never "a new dish"
    const isNew = !!m.dish_id && !eatenBefore.has(m.dish_id) && !firstSeen.has(m.dish_id)
    if (m.dish_id) firstSeen.add(m.dish_id)
    return {
      dishId: m.dish_id,
      dishName: m.dishes?.name ?? "",
      imageUrl: m.dishes?.image_path ? urls.get(m.dishes.image_path) ?? null : null,
      eatenOn: m.eaten_on,
      rating: m.rating,
      protein: m.dishes?.proteins[0] ?? null,   // the main one: first picked
      proteins: m.dishes?.proteins ?? [],
      traits: m.dishes?.traits ?? [],
      eatenOut: m.eaten_out,
      isNew,
    }
  })
}
