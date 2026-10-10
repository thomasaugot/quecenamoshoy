import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { createDish, deleteDish, enrichDishes, listDishes, setDishNotes, setFavourite, updateDish } from "@/services/dishes"
import { showToast } from "@/stores/toast-store"
import type { Dish } from "@/types/dish"
import { DishInUseError, RateLimitedError } from "@/utils/errors"
import { logger } from "@/utils/logger"

// Signed URLs last an hour: refetch well before one can expire in the cache.
export const useDishes = () =>
  useQuery({ queryKey: queryKeys.dishes.list, queryFn: listDishes, staleTime: 10 * 60_000, meta: { persist: true } })

type ToastKey = "created" | "updated" | "deleted" | "saved"

const useDishWrite = <V,>(
  write: (vars: V) => Promise<void>,
  toast: ToastKey,
  optimistic?: (dishes: Dish[], vars: V) => Dish[],
) => {
  const t = useTranslations("favourites.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: write,
    onMutate: async (vars: V) => {
      if (!optimistic) return undefined
      await queryClient.cancelQueries({ queryKey: queryKeys.dishes.list })
      const previous = queryClient.getQueryData<Dish[]>(queryKeys.dishes.list)
      if (previous) queryClient.setQueryData(queryKeys.dishes.list, optimistic(previous, vars))
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.dishes.list, context.previous)
      if (error instanceof DishInUseError) return showToast(t("inUse"), "warning")
      logger.error("dish write failed", error)
      showToast(t("failed"), "error")
    },
    onSuccess: () => showToast(t(toast), "success"),
    // meals carry the dish name and photo too
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
    ]),
  })
}

export const useCreateDish = () => useDishWrite(createDish, "created")
export const useUpdateDish = () => useDishWrite(updateDish, "updated")
export const useDeleteDish = () => useDishWrite(deleteDish, "deleted")

export const useSetFavourite = () =>
  useDishWrite(setFavourite, "saved", (dishes, { dishId, personId, on }) =>
    dishes.map((d) => d.id !== dishId ? d : {
      ...d,
      lovedBy: on ? [...d.lovedBy, personId] : d.lovedBy.filter((id) => id !== personId),
    }))

export const useSetDishNotes = () =>
  useDishWrite(setDishNotes, "saved", (dishes, { dishId, notes }) =>
    dishes.map((d) => d.id !== dishId ? d : { ...d, notes: notes.trim() || null }))

export const useEnrichDishes = () => {
  const t = useTranslations("favourites.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enrichDishes,
    onSuccess: ({ updated }) => showToast(t("sorted", { count: updated }), "success"),
    onError: (error) => {
      if (error instanceof RateLimitedError) return showToast(t("sortLimit"), "warning")
      logger.error("enrich failed", error)
      showToast(t("sortFailed"), "error")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
  })
}
