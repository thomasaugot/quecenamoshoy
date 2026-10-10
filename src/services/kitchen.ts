import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { KitchenLocation } from "@/types/database"
import type { KitchenItem, KitchenItemInput, ScanPhoto, ScanResult } from "@/types/kitchen"
import { functionErrorCode, RateLimitedError } from "@/utils/errors"

export const listKitchen = async (location: KitchenLocation): Promise<KitchenItem[]> => {
  const { data, error } = await supabase.from("kitchen_items")
    .select("key, category, label").eq("location", location).order("created_at")
  if (error) throw new Error(`kitchen query failed: ${error.code}`)
  return data
}

// Upsert on the unique (user, location, key): adding twice is harmless
export const addKitchenItems = async (items: KitchenItemInput[]): Promise<void> => {
  if (!items.length) return
  const { error } = await supabase.from("kitchen_items")
    .upsert(items, { onConflict: "user_id,location,key", ignoreDuplicates: true })
  if (error) throw new Error(`kitchen write failed: ${error.code}`)
}

export const removeKitchenItem = async ({ location, key }: { location: KitchenLocation; key: string }): Promise<void> => {
  const { error } = await supabase.from("kitchen_items").delete().match({ location, key })
  if (error) throw new Error(`kitchen write failed: ${error.code}`)
}

// Gemini looks at the photos (Edge Function scan-kitchen). Nothing is saved here.
export const scanKitchen = async (photos: ScanPhoto[]): Promise<ScanResult[]> => {
  const { data, error } = await supabase.functions.invoke<{ items: ScanResult[] }>("scan-kitchen", { body: { images: photos } })
  if (error instanceof FunctionsHttpError && error.context.status === 429) throw new RateLimitedError("scan-kitchen")
  if (error || !data) throw new Error(`scan failed: ${await functionErrorCode(error)}`)
  return data.items
}
