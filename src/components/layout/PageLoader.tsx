import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslations } from "use-intl"
import { useAppReady, useMarkLoaderGone } from "@/hooks/useAppReady"
import { useMotionPreference } from "@/hooks/useMotionPreference"
import { announce } from "@/utils/announce"
import { exitLoader, initLoader, tickProgress } from "@/utils/animations/loader-animations"

const MIN_DURATION_MS = 1800

// Initial load only. Navigations are a content crossfade in PageShell (06-TRANSITIONS).
export const PageLoader = () => {
  const t = useTranslations()
  const appReady = useAppReady()
  const markLoaderGone = useMarkLoaderGone()
  const { preference } = useMotionPreference()
  const [visible, setVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(0)
  const exitStarted = useRef(false)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    startTime.current = Date.now()
    const cleanup = initLoader(root)
    tickProgress(root, 0.85, MIN_DURATION_MS / 1000 - 0.5)
    return cleanup
  }, [])

  useEffect(() => {
    if (!appReady || exitStarted.current) return
    exitStarted.current = true
    const remaining = Math.max(0, MIN_DURATION_MS - (Date.now() - startTime.current))
    const timer = setTimeout(() => {
      const root = rootRef.current
      if (!root) return
      exitLoader(root, preference === "reduced", () => {
        setVisible(false)
        markLoaderGone()
        announce(t("a11y.pageReady"))
      })
    }, remaining)
    return () => clearTimeout(timer)
  }, [appReady, preference, markLoaderGone, t])

  if (!visible) return null

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label={t("a11y.loading")}
      className="z-loader fixed inset-0 flex items-center justify-center bg-bg"
    >
      <div className="flex w-56 flex-col items-center gap-6">
        <p data-anim="loader-mark" className="invisible text-heading text-center text-text">
          {t("app.name")}
        </p>
        <div aria-hidden="true" className="relative h-0.5 w-full overflow-hidden rounded-full bg-border">
          <div data-anim="loader-line" className="absolute inset-0 origin-left bg-primary [transform:scaleX(0)]" />
        </div>
      </div>
    </div>
  )
}
