import { useEffect } from "react"
import { useLocation } from "react-router"

const KEY_PREFIX = "scroll:"

export const readScrollMemory = (locationKey: string): number | null => {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + locationKey)
    return raw === null ? null : Number(raw)
  } catch {
    return null
  }
}

// Saves the current position under this history entry's key, so back/forward can restore
// it (06-TRANSITIONS). Throttled to one write per frame.
export const useScrollMemory = () => {
  const { key } = useLocation()
  useEffect(() => {
    let frame = 0
    const save = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        try { sessionStorage.setItem(KEY_PREFIX + key, String(window.scrollY)) } catch { /* storage blocked */ }
      })
    }
    window.addEventListener("scroll", save, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", save)
    }
  }, [key])
}
