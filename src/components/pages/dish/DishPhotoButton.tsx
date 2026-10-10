import { useId, type ChangeEvent } from "react"
import { useTranslations } from "use-intl"
import { DISH_PHOTO_MAX_SIDE } from "@/constants/dish"
import { useAuth } from "@/hooks/useAuth"
import { useUploadDishPhoto } from "@/hooks/useRecipe"
import { showToast } from "@/stores/toast-store"
import { photoForStorage } from "@/utils/image"
import { logger } from "@/utils/logger"

// My own photo of the dish, from the camera or the gallery: resized to WebP, then stored.
export const DishPhotoButton = ({ dishId }: { dishId: string }) => {
  const t = useTranslations("dish.photo")
  const inputId = useId()
  const { session } = useAuth()
  const upload = useUploadDishPhoto()

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !session) return
    try {
      upload.mutate({ userId: session.user.id, dishId, photo: await photoForStorage(file, DISH_PHOTO_MAX_SIDE) })
    } catch (error) {
      logger.error("photo prepare failed", error)
      showToast(t("unreadable"), "error")
    }
  }

  return (
    <div className="flex">
      <input id={inputId} type="file" accept="image/*" onChange={(e) => void pick(e)} className="peer sr-only" disabled={upload.isPending} />
      <label htmlFor={inputId} aria-busy={upload.isPending}
        className="text-button inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface px-4 transition-colors hover:bg-surface-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary">
        {upload.isPending ? t("uploading") : t("cta")}
      </label>
    </div>
  )
}
