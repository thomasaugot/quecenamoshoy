import { supabase } from "@/lib/supabase"

const BUCKET = "dish-images"
const SIGNED_URL_SECONDS = 60 * 60

// Private bucket: images are served through short-lived signed URLs, one request for the batch.
export const signedImageUrls = async (paths: string[]): Promise<Map<string, string>> => {
  if (paths.length === 0) return new Map()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (error) throw new Error(`signed urls failed: ${error.name}`)
  return new Map(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])))
}

// My own photo of a dish: {user}/{dish}.webp (the storage policy checks the user folder),
// replacing any previous one, then pointed to from the dish
export const uploadDishPhoto = async ({ userId, dishId, photo }: { userId: string; dishId: string; photo: Blob }): Promise<void> => {
  const path = `${userId}/${dishId}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(path, photo, { contentType: "image/webp", upsert: true })
  if (error) throw new Error(`photo upload failed: ${error.name}`)
  const { error: updateError } = await supabase.from("dishes").update({ image_path: path, image_credit: null }).eq("id", dishId)
  if (updateError) throw new Error(`photo link failed: ${updateError.code}`)
}
