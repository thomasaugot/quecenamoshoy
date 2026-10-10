import { routeData, routeModules } from "@/app/route-modules"
import { routeKeyFromPath } from "@/i18n/paths"
import { queryClient } from "@/lib/query-client"

const isLazyKey = (key: string): key is keyof typeof routeModules => key in routeModules

// Starts code AND data, resolves on the CODE only: navigateTo awaits it, and a slow query
// must never hold a faded-out page on screen (06-TRANSITIONS). Never throws.
export const preloadRoute = (href: string): Promise<unknown> => {
  const key = routeKeyFromPath(href)
  if (!key || !isLazyKey(key)) return Promise.resolve()
  routeData[key]?.(queryClient).catch(() => undefined)
  return routeModules[key]().catch(() => undefined)
}
