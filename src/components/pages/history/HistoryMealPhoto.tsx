import { useEffect, useId, useState, type ChangeEvent } from "react"
import { useTranslations } from "use-intl"
import { DISH_PHOTO_MAX_SIDE } from "@/constants/dish"
import { showToast } from "@/stores/toast-store"
import { photoForStorage } from "@/utils/image"
import { logger } from "@/utils/logger"

// A photo of the dinner itself (the restaurant plate, the takeaway box): taken or picked, resized
// to WebP right away and previewed; it is uploaded when the dinner is saved.
export const HistoryMealPhoto = ({ currentUrl, onPick }: { currentUrl: string | null; onPick: (photo: Blob) => void }) => {
  const t = useTranslations("history.editor")
  const inputId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const shown = preview ?? currentUrl

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const photo = await photoForStorage(file, DISH_PHOTO_MAX_SIDE)
      onPick(photo)
      setPreview(URL.createObjectURL(photo))
    } catch (error) {
      logger.error("meal photo prepare failed", error)
      showToast(t("photoUnreadable"), "error")
    }
  }

  return (
    <div className="flex items-center gap-4">
      {shown && <img src={shown} alt={t("photo")} width={96} height={96} className="photo-frame-sm aspect-square w-20 shrink-0 -rotate-2 object-cover" />}
      <input id={inputId} type="file" accept="image/*" onChange={(e) => void pick(e)} className="peer sr-only" />
      <label htmlFor={inputId}
        className="text-button inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface px-4 transition-colors hover:bg-surface-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary">
        {shown ? t("photoChange") : t("photoAdd")}
      </label>
    </div>
  )
}
