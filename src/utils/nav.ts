import { NAV_PARENT } from "@/constants/nav"
import type { RouteKey } from "@/config/i18n.config"

// "page" on the tab of the page itself; "true" on the tab a sub-page belongs to (still lit)
export const navCurrent = (tab: RouteKey, current: RouteKey | null): "page" | "true" | undefined =>
  current === tab ? "page" : current && NAV_PARENT[current] === tab ? "true" : undefined
