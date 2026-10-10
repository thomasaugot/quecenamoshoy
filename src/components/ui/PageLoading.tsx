import { createPortal } from "react-dom"
import { useTranslations } from "use-intl"
import { Cloche } from "@/components/ui/Cloche"
import { usePageLoadedHandoff } from "@/hooks/usePageLoadedHandoff"

// Nothing for the first second, then the mark fades in (14-PERFORMANCE). Portalled to body:
// inside <main> the fixed mark would follow main's entrance transform.
export const PageLoading = () => {
  const t = useTranslations()

  usePageLoadedHandoff()

  return (
    <>
      <div aria-busy="true" className="min-h-svh" />
      {createPortal(
        <div role="status" aria-label={t("a11y.loading")} className="pointer-events-none fixed inset-0 z-overlay flex items-center justify-center">
          <span aria-hidden="true" className="page-loading-mark">
            <Cloche inLoader className="h-20" />
          </span>
        </div>,
        document.body,
      )}
    </>
  )
}
