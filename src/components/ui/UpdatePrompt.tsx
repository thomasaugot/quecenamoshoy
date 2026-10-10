import { useEffect, useRef } from "react"
import { useTranslations } from "use-intl"
import { useRegisterSW } from "virtual:pwa-register/react"
import { Button } from "@/components/ui/Button"
import { useLoaderGone } from "@/hooks/useAppReady"
import { logger } from "@/utils/logger"

const CHECK_EVERY_MS = 60 * 60 * 1000

// A new version is OFFERED, never forced: until I tap "Actualizar", the old service worker
// keeps serving the old files and the open app keeps working (build-progressive-web-app
// skill §2). Persistent (no timer), in the top layer like the Toaster.
export const UpdatePrompt = () => {
  const t = useTranslations("pwa")
  const loaderGone = useLoaderGone()
  const rootRef = useRef<HTMLDivElement>(null)
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    // installed apps stay open for days: look for a new version every hour
    onRegisteredSW: (_url, registration) => {
      if (registration) setInterval(() => void registration.update(), CHECK_EVERY_MS)
    },
    onRegisterError: (error: unknown) => logger.error("service worker registration failed", error),
  })
  const show = needRefresh && loaderGone

  useEffect(() => {
    const root = rootRef.current
    if (root && show && !root.matches(":popover-open")) root.showPopover()
  }, [show])

  if (!show) return null
  return (
    <div ref={rootRef} popover="manual" role="status"
      className="m-0 mx-auto mt-auto mb-24 flex w-[min(28rem,calc(100%-2rem))] items-center justify-between gap-4 rounded-xl border-0 bg-text p-4 text-paper shadow-xl md:mb-6">
      <span className="text-body text-paper">{t("updateAvailable")}</span>
      <Button size="sm" onClick={() => void updateServiceWorker(true)} className="shrink-0">{t("update")}</Button>
    </div>
  )
}
