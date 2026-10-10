import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { logger } from "@/utils/logger"

// Once signed in, ask the browser not to evict the offline copy under storage pressure
// (Safari drops a non-installed site's storage after ~7 days). Never before sign-in.
export const usePersistentStorage = () => {
  const { session } = useAuth()
  const signedIn = !!session
  useEffect(() => {
    if (!signedIn || !navigator.storage?.persist) return
    navigator.storage.persist().catch((error: unknown) => logger.error("storage.persist failed", error))
  }, [signedIn])
}
