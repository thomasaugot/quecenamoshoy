import { FunctionsHttpError } from "@supabase/supabase-js"
import type { Locale } from "@/config/i18n.config"
import { supabase } from "@/lib/supabase"
import { signedImageUrls } from "@/services/storage"
import type { Dish, DishInput } from "@/types/dish"
import { DishInUseError, functionErrorCode, RateLimitedError } from "@/utils/errors"

const FOREIGN_KEY_VIOLATION = "23503"

export const listDishes = async (): Promise<Dish[]> => {
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, description, protein, traits, temp, equipment, notes, image_path, dish_favourites(person_id)")
    .order("name")
  if (error) throw new Error(`dishes query failed: ${error.code}`)
  const urls = await signedImageUrls(data.flatMap((d) => (d.image_path ? [d.image_path] : [])))
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    protein: d.protein,
    traits: d.traits,
    temp: d.temp,
    imageUrl: d.image_path ? urls.get(d.image_path) ?? null : null,
    lovedBy: d.dish_favourites.map((f) => f.person_id),
    equipment: d.equipment,
    notes: d.notes,
  }))
}

const columns = ({ name, description, protein, traits, temp }: DishInput) =>
  ({ name, description, protein, traits, temp })

// Favourites are rewritten as a set: remove who no longer loves it, add who does.
const writeLovedBy = async (dishId: string, lovedBy: string[]) => {
  const remove = supabase.from("dish_favourites").delete().eq("dish_id", dishId)
  const { error: removeError } = lovedBy.length
    ? await remove.not("person_id", "in", `(${lovedBy.join(",")})`)
    : await remove
  if (removeError) throw new Error(`favourites write failed: ${removeError.code}`)
  if (!lovedBy.length) return
  const { error } = await supabase.from("dish_favourites")
    .upsert(lovedBy.map((personId) => ({ person_id: personId, dish_id: dishId })), { ignoreDuplicates: true })
  if (error) throw new Error(`favourites write failed: ${error.code}`)
}

export const createDish = async (input: DishInput): Promise<void> => {
  const { data, error } = await supabase.from("dishes").insert(columns(input)).select("id").single()
  if (error) throw new Error(`create dish failed: ${error.code}`)
  await writeLovedBy(data.id, input.lovedBy)
}

export const updateDish = async ({ id, input }: { id: string; input: DishInput }): Promise<void> => {
  const { error } = await supabase.from("dishes").update(columns(input)).eq("id", id)
  if (error) throw new Error(`update dish failed: ${error.code}`)
  await writeLovedBy(id, input.lovedBy)
}

// Empty text clears the note.
export const setDishNotes = async ({ dishId, notes }: { dishId: string; notes: string }): Promise<void> => {
  const { error } = await supabase.from("dishes").update({ notes: notes.trim() || null }).eq("id", dishId)
  if (error) throw new Error(`dish notes write failed: ${error.code}`)
}

export const deleteDish = async (id: string): Promise<void> => {
  const { error } = await supabase.from("dishes").delete().eq("id", id)
  if (error?.code === FOREIGN_KEY_VIOLATION) throw new DishInUseError("dish has meals")
  if (error) throw new Error(`delete dish failed: ${error.code}`)
}

export const setFavourite = async ({ dishId, personId, on }: { dishId: string; personId: string; on: boolean }): Promise<void> => {
  const { error } = on
    ? await supabase.from("dish_favourites").upsert({ person_id: personId, dish_id: dishId }, { ignoreDuplicates: true })
    : await supabase.from("dish_favourites").delete().match({ person_id: personId, dish_id: dishId })
  if (error) throw new Error(`favourite write failed: ${error.code}`)
}

// One AI pass that fills in what each dish IS (Edge Function enrich-dishes). Only empty fields.
export const enrichDishes = async (language: Locale): Promise<{ updated: number; remaining: number }> => {
  const { data, error } = await supabase.functions.invoke<{ updated: number; remaining: number }>("enrich-dishes", { body: { language } })
  if (error instanceof FunctionsHttpError && error.context.status === 429) throw new RateLimitedError("enrich-dishes")
  if (error || !data) throw new Error(`enrich failed: ${await functionErrorCode(error)}`)
  return data
}
