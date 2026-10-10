import { useSyncExternalStore } from "react"

export type Breakpoint = "mobile" | "tablet" | "desktop"

const QUERIES: [Breakpoint, string][] = [
  ["desktop", "(min-width: 1280px)"],
  ["tablet", "(min-width: 768px)"],
]

const subscribeTo = (queries: string[]) => (onChange: () => void) => {
  const medias = queries.map((q) => window.matchMedia(q))
  medias.forEach((m) => m.addEventListener("change", onChange))
  return () => medias.forEach((m) => m.removeEventListener("change", onChange))
}

const subscribeBreakpoint = subscribeTo(QUERIES.map(([, q]) => q))
const getBreakpoint = (): Breakpoint =>
  QUERIES.find(([, q]) => window.matchMedia(q).matches)?.[0] ?? "mobile"

// Rendering decisions only — animations use gsap.matchMedia() (05-ANIMATIONS).
export const useBreakpoint = () => useSyncExternalStore(subscribeBreakpoint, getBreakpoint)

export const useMediaQuery = (query: string) =>
  useSyncExternalStore(subscribeTo([query]), () => window.matchMedia(query).matches)
