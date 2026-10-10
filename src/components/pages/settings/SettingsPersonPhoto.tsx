import { useId, type ChangeEvent } from "react"
import { useTranslations } from "use-intl"
import { IconEdit } from "@/components/ui/Icons"
import { PersonAvatar } from "@/components/ui/PersonAvatar"
import { DISH_PHOTO_MAX_SIDE } from "@/constants/dish"
import { useAuth } from "@/hooks/useAuth"
import { useUploadPersonPhoto } from "@/hooks/usePeople"
import { showToast } from "@/stores/toast-store"
import type { Person } from "@/types/person"
import { photoForStorage } from "@/utils/image"
import { logger } from "@/utils/logger"

// The one avatar on the card is also the way to change it: a tap takes or picks a photo
// (resized to WebP, then stored); a small pen on it says so.
export const SettingsPersonPhoto = ({ person }: { person: Person }) => {
  const t = useTranslations("settings.people")
  const inputId = useId()
  const { session } = useAuth()
  const upload = useUploadPersonPhoto()

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !session) return
    try {
      upload.mutate({ userId: session.user.id, personId: person.id, photo: await photoForStorage(file, DISH_PHOTO_MAX_SIDE) })
    } catch (error) {
      logger.error("person photo prepare failed", error)
      showToast(t("photoUnreadable"), "error")
    }
  }

  return (
    <div className="relative flex shrink-0">
      <input id={inputId} type="file" accept="image/*" aria-label={t("photoOf", { name: person.name })}
        onChange={(e) => void pick(e)} className="peer sr-only" disabled={upload.isPending} />
      <label htmlFor={inputId} aria-busy={upload.isPending}
        className={`relative cursor-pointer rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary ${upload.isPending ? "opacity-60" : ""}`}>
        <PersonAvatar person={person} />
        <span aria-hidden="true" className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text shadow-md">
          <IconEdit className="h-3.5 w-3.5 shrink-0" />
        </span>
      </label>
    </div>
  )
}
