import { supabase } from "@/lib/supabase"

const BUCKET = "dish-images"
const SIGNED_URL_SECONDS = 60 * 60

// A signed URL differs every time one is made, and a new URL makes the browser download the
// photo again — it blinks on every visit. So each URL is reused while it has a good margin left.
const REUSE_MARGIN_MS = 10 * 60 * 1000
const signedCache = new Map<string, { url: string; expiresAt: number }>()

// Private bucket: images are served through short-lived signed URLs, one request for the batch.
export const signedImageUrls = async (paths: string[]): Promise<Map<string, string>> => {
  const now = Date.now()
  const fresh = (p: string) => (signedCache.get(p)?.expiresAt ?? 0) - now > REUSE_MARGIN_MS
  const missing = [...new Set(paths)].filter((p) => !fresh(p))
  if (missing.length) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(missing, SIGNED_URL_SECONDS)
    if (error) throw new Error(`signed urls failed: ${error.name}`)
    for (const d of data) if (d.path && d.signedUrl) signedCache.set(d.path, { url: d.signedUrl, expiresAt: now + SIGNED_URL_SECONDS * 1000 })
  }
  return new Map(paths.flatMap((p) => { const c = signedCache.get(p); return c ? [[p, c.url] as const] : [] }))
}

// My own photo of a dish: {user}/{dish}.webp (the storage policy checks the user folder),
// replacing any previous one, then pointed to from the dish
export const uploadDishPhoto = async ({ userId, dishId, photo }: { userId: string; dishId: string; photo: Blob }): Promise<void> => {
  const path = `${userId}/${dishId}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(path, photo, { contentType: "image/webp", upsert: true })
  signedCache.delete(path)   // same path, new photo: the old URL would show the old one
  if (error) throw new Error(`photo upload failed: ${error.name}`)
  const { error: updateError } = await supabase.from("dishes").update({ image_path: path, image_credit: null }).eq("id", dishId)
  if (updateError) throw new Error(`photo link failed: ${updateError.code}`)
}
