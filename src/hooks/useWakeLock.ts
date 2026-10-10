import { useEffect } from "react"
import { logger } from "@/utils/logger"

// Keeps the screen on while `active` (cooking with floury hands). The browser drops the lock
// when the tab is hidden, so it is taken again on return. Silently absent where unsupported.
export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const take = async () => {
      try {
        const next = await navigator.wakeLock.request("screen")
        if (cancelled) await next.release()
        else lock = next
      } catch (error) {
        logger.error("wake lock refused", error)
      }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void take() }
    void take()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      void lock?.release()
    }
  }, [active])
}
