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
    .select("id, name, description, proteins, traits, tags, temp, equipment, notes, image_path, dish_favourites(person_id), dish_dislikes(person_id)")
    .order("name")
  if (error) throw new Error(`dishes query failed: ${error.code}`)
  const urls = await signedImageUrls(data.flatMap((d) => (d.image_path ? [d.image_path] : [])))
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    proteins: d.proteins,
    tags: d.tags,
    traits: d.traits,
    temp: d.temp,
    imageUrl: d.image_path ? urls.get(d.image_path) ?? null : null,
    lovedBy: d.dish_favourites.map((f) => f.person_id),
    dislikedBy: d.dish_dislikes.map((f) => f.person_id),
    equipment: d.equipment,
    notes: d.notes,
  }))
}

const columns = ({ name, description, proteins, traits, tags, temp }: DishInput) =>
  ({ name, description, proteins, traits, tags, temp })

// Who loves it and who doesn't are each rewritten as a set: remove who left, add who joined.
const writePeople = async (table: "dish_favourites" | "dish_dislikes", dishId: string, ids: string[]) => {
  const remove = supabase.from(table).delete().eq("dish_id", dishId)
  const { error: removeError } = ids.length
    ? await remove.not("person_id", "in", `(${ids.join(",")})`)
    : await remove
  if (removeError) throw new Error(`${table} write failed: ${removeError.code}`)
  if (!ids.length) return
  const { error } = await supabase.from(table)
    .upsert(ids.map((personId) => ({ person_id: personId, dish_id: dishId })), { ignoreDuplicates: true })
  if (error) throw new Error(`${table} write failed: ${error.code}`)
}

const writeTastes = (dishId: string, input: DishInput) =>
  Promise.all([writePeople("dish_favourites", dishId, input.lovedBy), writePeople("dish_dislikes", dishId, input.dislikedBy)])

export const createDish = async (input: DishInput): Promise<string> => {
  const { data, error } = await supabase.from("dishes").insert(columns(input)).select("id").single()
  if (error) throw new Error(`create dish failed: ${error.code}`)
  await writeTastes(data.id, input)
  return data.id
}

export const updateDish = async ({ id, input }: { id: string; input: DishInput }): Promise<void> => {
  const { error } = await supabase.from("dishes").update(columns(input)).eq("id", id)
  if (error) throw new Error(`update dish failed: ${error.code}`)
  await writeTastes(id, input)
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
