import { createContext, useRef, type ReactNode, type RefObject } from "react"
import { useNavigate } from "react-router"
import { exitPage, killAllAnimations } from "@/utils/animations/page-transitions"
import { preloadRoute } from "@/utils/preload-route"

export type TransitionValue = {
  pageRef: RefObject<HTMLElement | null>
  navigateTo: (href: string) => Promise<void>
  resetTransition: () => void
}

export const TransitionContext = createContext<TransitionValue | null>(null)

const FALLBACK_MS = 600

// isTransitioning lives in a ref: nothing renders from it, navigateTo is the only gate.
export const TransitionProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const pageRef = useRef<HTMLElement | null>(null)
  const transitioning = useRef(false)

  const resetTransition = () => { transitioning.current = false }

  const navigateTo = async (href: string) => {
    if (transitioning.current) return
    transitioning.current = true
    const el = pageRef.current
    // fade and page download in PARALLEL: the new page lands at max(180ms, download)
    await Promise.all([el ? exitPage(el) : Promise.resolve(), preloadRoute(href)])
    killAllAnimations(el)
    navigate(href)
    setTimeout(resetTransition, FALLBACK_MS)
  }

  const value = { pageRef, navigateTo, resetTransition }
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>
}
