import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/constants/query-keys"
import { listRecentMeals } from "@/services/meals"
import { getMe } from "@/services/people"
import { isoDaysAgo } from "@/utils/dates"

const RECENT_DAYS = 14

export const useMe = () => useQuery({ queryKey: queryKeys.me, queryFn: getMe, staleTime: 30 * 60_000, meta: { persist: true } })

// Signed URLs last an hour: refetch well before, never serve an expired one from cache.
export const useRecentMeals = () =>
  useQuery({
    queryKey: queryKeys.meals.recent(RECENT_DAYS),
    queryFn: () => listRecentMeals(isoDaysAgo(RECENT_DAYS)),
    staleTime: 10 * 60_000,
    meta: { persist: true },
  })
