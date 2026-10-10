import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { addKitchenItems, listKitchen, removeKitchenItem, scanKitchen } from "@/services/kitchen"
import { showToast } from "@/stores/toast-store"
import type { KitchenLocation } from "@/types/database"
import type { KitchenItem, KitchenItemInput } from "@/types/kitchen"
import { RateLimitedError } from "@/utils/errors"
import { logger } from "@/utils/logger"

// Switching home ↔ travel keeps the previous list on screen until the other one arrives
export const useKitchen = (location: KitchenLocation) =>
  useQuery({
    queryKey: queryKeys.kitchen.items(location),
    queryFn: () => listKitchen(location),
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    meta: { persist: true },
  })

// Chip taps patch the cache first, so the checklist answers at once; rolled back on failure.
export const useAddKitchenItems = () => {
  const t = useTranslations("kitchen.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addKitchenItems,
    onMutate: async (items: KitchenItemInput[]) => {
      const location = items[0]?.location
      if (!location) return undefined
      const key = queryKeys.kitchen.items(location)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<KitchenItem[]>(key)
      if (previous) queryClient.setQueryData(key, [...previous, ...items.map(({ key: k, category, label }) => ({ key: k, category, label }))])
      return { previous, key }
    },
    onError: (error, _items, context) => {
      logger.error("kitchen write failed", error)
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
      showToast(t("failed"), "error")
    },
    onSuccess: (_data, items) => showToast(t("added", { count: items.length }), "success"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.all }),
  })
}

export const useRemoveKitchenItem = () => {
  const t = useTranslations("kitchen.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeKitchenItem,
    onMutate: async ({ location, key: itemKey }: { location: KitchenLocation; key: string }) => {
      const key = queryKeys.kitchen.items(location)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<KitchenItem[]>(key)
      if (previous) queryClient.setQueryData(key, previous.filter((i) => i.key !== itemKey))
      return { previous, key }
    },
    onError: (error, _vars, context) => {
      logger.error("kitchen write failed", error)
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
      showToast(t("failed"), "error")
    },
    onSuccess: () => showToast(t("removed"), "success"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.kitchen.all }),
  })
}

export const useScanKitchen = () => {
  const t = useTranslations("kitchen.toasts")
  return useMutation({
    mutationFn: scanKitchen,
    onError: (error) => {
      if (error instanceof RateLimitedError) return showToast(t("rateLimited"), "warning")
      logger.error("kitchen scan failed", error)
      showToast(t("scanFailed"), "error")
    },
  })
}
