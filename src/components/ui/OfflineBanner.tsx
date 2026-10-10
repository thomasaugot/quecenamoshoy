import { useTranslations } from "use-intl"
import { useOnline } from "@/hooks/useOnline"

// Offline: what I've already seen still reads; new ideas, saving and photos wait for a connection.
export const OfflineBanner = () => {
  const t = useTranslations("pwa")
  const online = useOnline()
  if (online) return null
  return (
    <p role="status" className="z-toast text-body-sm fixed inset-x-0 top-navbar bg-highlight px-4 py-2 text-center text-on-highlight">
      {t("offline")}
    </p>
  )
}
