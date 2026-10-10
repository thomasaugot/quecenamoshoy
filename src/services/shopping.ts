import { supabase } from "@/lib/supabase"
import type { Ingredient } from "@/types/recipe"
import type { ShoppingItem } from "@/types/shopping"

export const listShopping = async (): Promise<ShoppingItem[]> => {
  const { data, error } = await supabase.from("shopping_items")
    .select("id, item, quantity, dish_id, checked, dishes(name)").order("created_at")
  if (error) throw new Error(`shopping query failed: ${error.code}`)
  return data.map((r) => ({ id: r.id, item: r.item, quantity: r.quantity, dishId: r.dish_id, dishName: r.dishes?.name ?? null, checked: r.checked }))
}

export const addShopping = async (items: { item: string; quantity: string; dishId: string | null }[]): Promise<void> => {
  if (!items.length) return
  const { error } = await supabase.from("shopping_items")
    .insert(items.map((i) => ({ item: i.item.slice(0, 120), quantity: i.quantity.slice(0, 60), dish_id: i.dishId })))
  if (error) throw new Error(`shopping write failed: ${error.code}`)
}

export const ingredientsToShopping = (ingredients: readonly Ingredient[], dishId: string) =>
  ingredients.map((i) => ({ item: i.item, quantity: i.quantity, dishId }))

export const setShoppingChecked = async ({ ids, checked }: { ids: string[]; checked: boolean }): Promise<void> => {
  const { error } = await supabase.from("shopping_items").update({ checked }).in("id", ids)
  if (error) throw new Error(`shopping write failed: ${error.code}`)
}

export const removeShopping = async (which: "checked" | "all"): Promise<void> => {
  const query = supabase.from("shopping_items").delete()
  const { error } = which === "checked" ? await query.eq("checked", true) : await query.not("id", "is", null)
  if (error) throw new Error(`shopping write failed: ${error.code}`)
}
