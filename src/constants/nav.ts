import type { RouteKey } from "@/config/i18n.config"

// Structure only — labels live in locales/*/common.json → nav.
export const NAV_ITEMS = [
  { routeKey: "home", labelKey: "home", icon: "today" },
  { routeKey: "favourites", labelKey: "favourites", icon: "heart" },
  { routeKey: "history", labelKey: "history", icon: "history" },
  { routeKey: "kitchen", labelKey: "kitchen", icon: "kitchen" },
  { routeKey: "settings", labelKey: "settings", icon: "settings" },
] as const satisfies readonly { routeKey: RouteKey; labelKey: string; icon: string }[]

// Pages without a tab of their own light up the tab they are reached from
export const NAV_PARENT: Partial<Record<RouteKey, RouteKey>> = {
  wizard: "home",
  roulette: "home",
  dish: "favourites",
  recap: "history",
}

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"]
