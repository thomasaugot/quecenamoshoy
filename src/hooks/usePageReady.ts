import { useEffect } from "react"
import { useMarkReady } from "@/hooks/useAppReady"

const MIN_DELAY_MS = 600

// Runs ONCE, at boot, from PageShell only (05-ANIMATIONS). appReady is one-shot: page
// entrances key on pathname instead.
export const usePageReady = () => {
  const markReady = useMarkReady()
  useEffect(() => {
    let cancelled = false
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_DELAY_MS))
    Promise.all([document.fonts.ready, minDelay])
      .then(() => { if (!cancelled) markReady() })
      .catch(() => { if (!cancelled) markReady() })
    return () => { cancelled = true }
  }, [markReady])
}
