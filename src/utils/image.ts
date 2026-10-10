import type { ScanPhoto } from "@/types/kitchen"

const drawResized = async (file: File, maxSide: number) => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas 2d unavailable")
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

// A photo straight from the phone is 3–8 MB. Shrink it to `maxSide` and re-encode as JPEG
// before it travels: a few hundred KB, enough for the model to recognise a whisk.
export const photoForUpload = async (file: File, maxSide: number): Promise<ScanPhoto> => {
  const dataUrl = (await drawResized(file, maxSide)).toDataURL("image/jpeg", 0.82)
  return { mimeType: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1) }
}

// A dish photo for Storage: resized, WebP (the bucket path is {user}/{dish}.webp)
export const photoForStorage = async (file: File, maxSide: number): Promise<Blob> => {
  const canvas = await drawResized(file, maxSide)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))
  if (!blob) throw new Error("webp encoding failed")
  return blob
}
