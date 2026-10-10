import { createContext, useEffect, useRef, type ReactNode } from "react"
import { gsap } from "@/lib/gsap"
import { Lenis } from "@/lib/lenis"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export type ScrollValue = {
  scrollToTop: () => void
  scrollToY: (y: number) => void
  setLocked: (locked: boolean) => void
}

export const ScrollContext = createContext<ScrollValue | null>(null)

// Lenis on desktop only (≥1280px), held in a ref — it never drives rendering (05-ANIMATIONS).
export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const isDesktop = useMediaQuery("(min-width: 1280px)")
  const lenisRef = useRef<InstanceType<typeof Lenis> | null>(null)

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
  }, [])

  useEffect(() => {
    if (!isDesktop) return
    const lenis = new Lenis()
    lenisRef.current = lenis
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [isDesktop])

  // Lenis skips a scrollTo to where it believes it already is, so the document is always
  // written too (06-TRANSITIONS → Landing at the top).
  const scrollToY = (y: number) => {
    lenisRef.current?.scrollTo(y, { immediate: true, force: true })
    window.scrollTo(0, y)
  }
  const scrollToTop = () => scrollToY(0)

  // Modal open / page change: no page scroll underneath.
  const setLocked = (locked: boolean) => {
    if (locked) lenisRef.current?.stop()
    else lenisRef.current?.start()
    document.documentElement.classList.toggle("overflow-hidden", locked)
  }

  const value = { scrollToTop, scrollToY, setLocked }
  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
}
