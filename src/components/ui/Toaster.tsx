import { useEffect, useRef } from "react"
import { useTranslations } from "use-intl"
import { ToastItem } from "@/components/ui/ToastItem"
import { useLoaderGone } from "@/hooks/useAppReady"
import { useToastStore } from "@/stores/toast-store"

// popover="manual" puts the toaster in the TOP LAYER: an open <dialog> sits above any
// z-index, so a toast in plain body would render behind a modal (07-UI_PRIMITIVES).
// Renders nothing until loaderGone: a toast under the loader burns its lifetime unseen.
export const Toaster = () => {
  const t = useTranslations("a11y")
  const loaderGone = useLoaderGone()
  const toasts = useToastStore((s) => s.toasts)
  const rootRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || toasts.length === 0) return
    // re-show so it is the NEWEST top-layer entry, above a dialog opened since
    if (root.matches(":popover-open")) root.hidePopover()
    root.showPopover()
  }, [toasts])

  if (!loaderGone) return null

  return (
    <ol
      ref={rootRef}
      popover="manual"
      aria-label={t("notifications")}
      className="pointer-events-none m-0 mx-auto mt-4 flex w-[min(28rem,calc(100%-2rem))] flex-col gap-2 overflow-visible border-0 bg-transparent p-0"
    >
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} />)}
    </ol>
  )
}
