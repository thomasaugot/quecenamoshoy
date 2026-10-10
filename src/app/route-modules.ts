import type { QueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { listDishes } from "@/services/dishes"
import { listMeals } from "@/services/meals"
import { listPeople } from "@/services/people"
import { getSettings } from "@/services/settings"

// The single list of lazy page imports, keyed by routeKey (06-TRANSITIONS). The router and
// preloadRoute use the SAME functions, so a preload is the download the router reuses.
export const routeModules = {
  favourites: () => import("@/components/pages/favourites/FavouritesPage"),
  history: () => import("@/components/pages/history/HistoryPage"),
  dish: () => import("@/components/pages/dish/DishPage"),
  wizard: () => import("@/components/pages/wizard/WizardPage"),
  roulette: () => import("@/components/pages/roulette/RoulettePage"),
  settings: () => import("@/components/pages/settings/SettingsPage"),
  kitchen: () => import("@/components/pages/kitchen/KitchenPage"),
  shopping: () => import("@/components/pages/shopping/ShoppingPage"),
  recap: () => import("@/components/pages/recap/RecapPage"),
  login: () => import("@/components/pages/login/LoginPage"),
  notFound: () => import("@/components/pages/not-found/NotFoundPage"),
} as const

// Each page's primary queries, prefetched on intent (14-PERFORMANCE §4). Filled in as pages
// get their queries.
export const routeData: Partial<Record<keyof typeof routeModules, (client: QueryClient) => Promise<void>>> = {
  history: async (client) => {
    await Promise.all([
      client.prefetchInfiniteQuery({ queryKey: queryKeys.meals.history, queryFn: ({ pageParam }) => listMeals(pageParam), initialPageParam: 0, staleTime: 10 * 60_000 }),
      client.prefetchQuery({ queryKey: queryKeys.people.list, queryFn: listPeople, staleTime: 5 * 60_000 }),
    ])
  },
  favourites: async (client) => {
    await Promise.all([
      client.prefetchQuery({ queryKey: queryKeys.dishes.list, queryFn: listDishes, staleTime: 10 * 60_000 }),
      client.prefetchQuery({ queryKey: queryKeys.people.list, queryFn: listPeople, staleTime: 5 * 60_000 }),
    ])
  },
  settings: async (client) => {
    await Promise.all([
      client.prefetchQuery({ queryKey: queryKeys.people.list, queryFn: listPeople, staleTime: 5 * 60_000 }),
      client.prefetchQuery({ queryKey: queryKeys.settings, queryFn: getSettings, staleTime: 5 * 60_000 }),
    ])
  },
}
