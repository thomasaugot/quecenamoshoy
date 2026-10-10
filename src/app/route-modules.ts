import type { QueryClient } from "@tanstack/react-query"

// The single list of lazy page imports, keyed by routeKey (06-TRANSITIONS). The router and
// preloadRoute use the SAME functions, so a preload is the download the router reuses.
export const routeModules = {
  favourites: () => import("@/components/pages/favourites/FavouritesPage"),
  history: () => import("@/components/pages/history/HistoryPage"),
  dish: () => import("@/components/pages/dish/DishPage"),
  login: () => import("@/components/pages/login/LoginPage"),
  notFound: () => import("@/components/pages/not-found/NotFoundPage"),
} as const

// Each page's primary queries, prefetched on intent (14-PERFORMANCE §4). Filled in as pages
// get their queries.
export const routeData: Partial<Record<keyof typeof routeModules, (client: QueryClient) => Promise<void>>> = {}
