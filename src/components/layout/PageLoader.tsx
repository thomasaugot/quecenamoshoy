import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslations } from "use-intl"
import { Cloche } from "@/components/ui/Cloche"
import { IconDishBowl, IconDishBurger, IconDishFish, IconDishPot } from "@/components/ui/Icons"
import { useAppReady, useMarkLoaderGone } from "@/hooks/useAppReady"
import { useMotionPreference } from "@/hooks/useMotionPreference"
import { announce } from "@/utils/announce"
import { exitLoader, initLoader } from "@/utils/animations/loader-animations"

const MIN_DURATION_MS = 2000
const DISH = "invisible absolute inset-0 h-full w-full"

// Initial load only. Navigations are a content crossfade in PageShell (06-TRANSITIONS).
// Tonight's order slip ("la comanda", same paper as the wizard's): it slides in over the one
// underneath, a tack pins it, the lines write themselves by hand while the dish spins like the
// roulette — then the slip is torn off and flies away, and the app is what was under it.
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
    // Not useGSAPAnimations: that waits for appReady, and the loader is what plays BEFORE it.
    const cleanup = initLoader(root, preference === "reduced")
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
    <div ref={rootRef} role="status" aria-label={t("a11y.loading")} className="z-loader fixed inset-0 overflow-hidden">
      {/* covers the app from the first paint: data-part, not the fade-in data-anim */}
      <div data-part="loader-ground" className="absolute inset-0 bg-bg" />

      <div aria-hidden="true" className="absolute top-[46%] left-1/2 w-[min(19rem,82vw)] -translate-x-1/2 -translate-y-1/2 lg:w-92">
        {/* yesterday's slip, still on the spike underneath */}
        <div data-anim="loader-slip-back" className="invisible absolute inset-0 rotate-3 rounded-sm bg-surface-2 shadow-md" />

        <div data-anim="loader-slip" className="invisible relative -rotate-2 flex flex-col gap-5 rounded-sm bg-paper px-7 pt-9 pb-8 shadow-xl lg:px-9 lg:pt-11 lg:pb-10">
          <span data-anim="loader-tack" className="invisible absolute -top-2 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-accent-strong shadow-md" />

          <div className="flex items-end justify-between gap-4">
            <p data-anim="loader-write" className="invisible text-voice-lg text-accent-strong">{t("loader.slip")}</p>
            <Cloche inLoader className="-mr-2 mb-0.5 h-12 lg:-mr-2.5 lg:h-14" />
          </div>

          <dl className="flex flex-col gap-3">
            <div data-anim="loader-write" className="invisible grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <dt className="text-label">{t("loader.table")}</dt>
              <dd className="text-voice leading-none text-text">{t("loader.tableValue")}</dd>
            </div>
            <div data-anim="loader-write" className="invisible grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <dt className="text-label">{t("loader.guests")}</dt>
              <dd className="text-voice leading-none text-text">{t("loader.guestsValue")}</dd>
            </div>
            <div data-anim="loader-write" className="invisible grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <dt className="text-label">{t("loader.dish")}</dt>
              <dd className="relative h-7 w-7 text-primary">
                <IconDishBowl data-anim="loader-dish" className={DISH} />
                <IconDishBurger data-anim="loader-dish" className={`${DISH} text-highlight-deep`} />
                <IconDishFish data-anim="loader-dish" className={`${DISH} text-sage`} />
                <IconDishPot data-anim="loader-dish" className={`${DISH} text-accent-strong`} />
              </dd>
            </div>
          </dl>

          <p data-anim="loader-write" className="invisible text-title text-text">{t("app.name")}</p>

          {/* says it is working: the kitchen's "marchando" and three dots that keep going */}
          <div data-anim="loader-write" className="invisible flex items-center gap-2">
            <span className="text-note text-accent-strong">{t("loader.status")}</span>
            <span className="flex items-center gap-1.5 pt-1">
              <span data-part="loader-dot" className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
              <span data-part="loader-dot" className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
              <span data-part="loader-dot" className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
