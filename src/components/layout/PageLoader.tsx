import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslations } from "use-intl"
import { Cloche } from "@/components/ui/Cloche"
import { appConfig } from "@/config/app.config"
import { useAppReady, useMarkLoaderGone } from "@/hooks/useAppReady"
import { useMotionPreference } from "@/hooks/useMotionPreference"
import { announce } from "@/utils/announce"
import { exitLoader, initLoader, tickProgress } from "@/utils/animations/loader-animations"

const MIN_DURATION_MS = 2200
// Dev preview pages (/zz…) are opened to look at one thing: no loading screen in front of it.
const isPreview = () => appConfig.isDev && window.location.pathname.includes("/zz")

// Initial load only. Navigations are a content crossfade in PageShell (06-TRANSITIONS).
// The logo IS the loader: the cloche lifts on a dish while the bar fills, under the app's name.
// When the app is ready the bar completes and the whole thing rises away.
export const PageLoader = () => {
  const t = useTranslations()
  const appReady = useAppReady()
  const markLoaderGone = useMarkLoaderGone()
  const { preference } = useMotionPreference()
  const [visible, setVisible] = useState(() => !isPreview())
  const rootRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(0)
  const exitStarted = useRef(false)

  useEffect(() => {
    if (!visible) markLoaderGone()
  }, [visible, markLoaderGone])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    startTime.current = Date.now()
    // Not useGSAPAnimations: that waits for appReady, and the loader is what plays BEFORE it.
    const cleanup = initLoader(root, preference === "reduced")
    tickProgress(root, 0.85, MIN_DURATION_MS / 1000 - 0.4)
    return cleanup
  }, [preference])

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
    <div ref={rootRef} role="status" aria-label={t("a11y.loading")} className="z-loader fixed inset-0 flex items-center justify-center bg-bg px-6">
      <div data-anim="loader-content" className="invisible flex w-full max-w-xs flex-col items-center gap-6 lg:max-w-sm">
        <Cloche inLoader className="h-56 lg:h-80" />
        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-title text-center text-text">{t("app.name")}</p>
          <div aria-hidden="true" className="relative h-1.5 w-48 overflow-hidden rounded-full bg-border lg:w-56">
            <div data-anim="loader-line" className="absolute inset-0 origin-left rounded-full bg-accent-strong [transform:scaleX(0)]" />
          </div>
          <p className="text-note text-text-muted">{t("loader.thinking")}</p>
        </div>
      </div>
    </div>
  )
}
