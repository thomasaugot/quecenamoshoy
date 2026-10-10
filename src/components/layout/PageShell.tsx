import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react"
import { useLocation, useNavigationType } from "react-router"
import { PAGE_LOADED_EVENT } from "@/constants/events"
import { usePageReady } from "@/hooks/usePageReady"
import { useAuth } from "@/hooks/useAuth"
import { useScroll } from "@/hooks/useScroll"
import { readScrollMemory, useScrollMemory } from "@/hooks/useScrollMemory"
import { useTransition } from "@/hooks/useTransition"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { announce } from "@/utils/announce"
import { enterPage } from "@/utils/animations/page-transitions"

// The ONLY place enterPage runs (06-TRANSITIONS). Navbar and bottom tabs are siblings.
export const PageShell = ({ children }: { children: ReactNode }) => {
  usePageReady()
  useScrollMemory()
  const { pathname, key } = useLocation()
  const navigationType = useNavigationType()
  const { pageRef, resetTransition } = useTransition()
  const { scrollToTop, scrollToY } = useScroll()
  const isFirstRender = useRef(true)
  const { session } = useAuth()

  useLayoutEffect(() => {
    const el = pageRef.current
    if (!el || isFirstRender.current) return
    gsap.killTweensOf(el)
    gsap.set(el, { opacity: 0, y: 28 })
    ScrollTrigger.clearScrollMemory("manual")
    if (navigationType !== "POP") scrollToTop()
  }, [pathname, pageRef, navigationType, scrollToTop])

  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    let cancelled = false
    const settle = () => {
      if (cancelled) return
      resetTransition()
      ScrollTrigger.clearScrollMemory("manual")
      ScrollTrigger.refresh()
      const saved = navigationType === "POP" ? readScrollMemory(key) : null
      if (saved === null) scrollToTop()
      else scrollToY(saved)
      el.focus({ preventScroll: true })
      announce(document.title)
    }
    void enterPage(el).then(settle)
    // PageLoading hands the entrance back once the real page is committed (14-PERFORMANCE)
    const replay = () => {
      gsap.set(el, { opacity: 0, y: 28 })
      void enterPage(el)
    }
    window.addEventListener(PAGE_LOADED_EVENT, replay)
    return () => {
      cancelled = true
      window.removeEventListener(PAGE_LOADED_EVENT, replay)
    }
  }, [pathname, key, navigationType, pageRef, resetTransition, scrollToTop, scrollToY])

  return (
    <main
      id="main-content"
      ref={pageRef}
      tabIndex={-1}
      className={`min-h-svh outline-none ${session ? "pt-navbar pb-bottom-nav md:pb-0" : ""}`}
    >
      {children}
    </main>
  )
}
