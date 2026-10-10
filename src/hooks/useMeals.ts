import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { DISH_NOTES_SHOWN } from "@/constants/meal"
import { queryKeys } from "@/constants/query-keys"
import { createMeal, deleteMeal, getUnratedMeal, listCountedMeals, listDishNotes, listLastEaten, listMeals, listRecapMeals, MEALS_PAGE_SIZE, rateMeal, updateMeal } from "@/services/meals"
import { showToast } from "@/stores/toast-store"
import { logger } from "@/utils/logger"

// Signed URLs last an hour: refetch well before one can expire in the cache.
export const useMealHistory = () =>
  useInfiniteQuery({
    queryKey: queryKeys.meals.history,
    queryFn: ({ pageParam }) => listMeals(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length === MEALS_PAGE_SIZE ? pages.length : undefined),
    staleTime: 10 * 60_000,
    meta: { persist: true },
  })

// A year back is plenty: older than that is "a long time" anyway
export const useLastEaten = (sinceIso: string) =>
  useQuery({ queryKey: queryKeys.meals.lastEaten, queryFn: () => listLastEaten(sinceIso), staleTime: 10 * 60_000 })

// The last notes on a dish (dish page) — cached for offline reading like the recipe
export const useDishNotes = (dishId: string) =>
  useQuery({ queryKey: queryKeys.meals.ofDish(dishId), queryFn: () => listDishNotes(dishId, DISH_NOTES_SHOWN), staleTime: 5 * 60_000, meta: { persist: true } })

export const useCountedMeals = (sinceIso: string) =>
  useQuery({ queryKey: queryKeys.meals.since(sinceIso), queryFn: () => listCountedMeals(sinceIso), staleTime: 5 * 60_000 })

type ToastKey = "logged" | "updated" | "deleted" | "rated"

const useMealWrite = <V,>(write: (vars: V) => Promise<void>, toast: ToastKey) => {
  const t = useTranslations("history.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: write,
    onError: (error) => {
      logger.error("meal write failed", error)
      showToast(t("failed"), "error")
    },
    onSuccess: () => showToast(t(toast), "success"),
    // a meal can create a dish on the fly
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
    ]),
  })
}

export const useCreateMeal = () => useMealWrite(createMeal, "logged")
export const useUpdateMeal = () => useMealWrite(updateMeal, "updated")
export const useDeleteMeal = () => useMealWrite(deleteMeal, "deleted")

export const useUnratedMeal = (fromIso: string, toIso: string) =>
  useQuery({ queryKey: queryKeys.meals.unrated(fromIso), queryFn: () => getUnratedMeal(fromIso, toIso), staleTime: 10 * 60_000 })

export const useRateMeal = () => useMealWrite(rateMeal, "rated")

export const useRecapMeals = (month: string, from: string, to: string) =>
  useQuery({ queryKey: queryKeys.meals.month(month), queryFn: () => listRecapMeals(from, to), staleTime: 10 * 60_000, meta: { persist: true } })
