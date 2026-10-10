import { useLocale } from "use-intl"
import { localizedPath } from "@/i18n/paths"
import { queryClient } from "@/lib/query-client"
import { signOut } from "@/services/auth"
import { logger } from "@/utils/logger"

// Full document load, never navigateTo: the query cache holds private data in memory and a
// soft navigation would leave it there for the next person on the device (14-PERFORMANCE).
export const useSignOut = () => {
  const locale = useLocale()
  return async () => {
    queryClient.clear()
    try {
      await signOut()
    } catch (error) {
      logger.error("signOut failed", error)
    }
    window.location.assign(localizedPath("login", locale))
  }
}
