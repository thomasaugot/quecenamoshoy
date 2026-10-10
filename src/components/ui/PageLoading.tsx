import { useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "use-intl"
import { PAGE_LOADED_EVENT } from "@/constants/events"

// Nothing for the first second, then the mark fades in (14-PERFORMANCE). Portalled to body:
// inside <main> the fixed mark would follow main's entrance transform.
export const PageLoading = () => {
  const t = useTranslations()

  // Cleanup runs in the commit that swaps in the real page: PageShell replays its entrance.
  useLayoutEffect(() => () => { window.dispatchEvent(new Event(PAGE_LOADED_EVENT)) }, [])

  return (
    <>
      <div aria-busy="true" className="min-h-svh" />
      {createPortal(
        <div role="status" aria-label={t("a11y.loading")} className="pointer-events-none fixed inset-0 z-overlay flex items-center justify-center">
          <span aria-hidden="true" className="page-loading-mark text-heading font-sans text-primary">
            {t("app.shortName")}
          </span>
        </div>,
        document.body,
      )}
    </>
  )
}
