import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { addShopping, listShopping, removeShopping, setShoppingChecked } from "@/services/shopping"
import { showToast } from "@/stores/toast-store"
import type { ShoppingItem } from "@/types/shopping"
import { logger } from "@/utils/logger"

// Kept offline (persisted): in the shop, the list must open without a connection
export const useShopping = () =>
  useQuery({ queryKey: queryKeys.shopping, queryFn: listShopping, staleTime: 30_000, meta: { persist: true } })

const useShoppingWrite = <V,>(
  write: (vars: V) => Promise<void>,
  toast: "added" | "cleared" | null,
  optimistic?: (items: ShoppingItem[], vars: V) => ShoppingItem[],
) => {
  const t = useTranslations("shopping.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: write,
    onMutate: async (vars: V) => {
      if (!optimistic) return undefined
      await queryClient.cancelQueries({ queryKey: queryKeys.shopping })
      const previous = queryClient.getQueryData<ShoppingItem[]>(queryKeys.shopping)
      if (previous) queryClient.setQueryData(queryKeys.shopping, optimistic(previous, vars))
      return { previous }
    },
    onError: (error, _vars, context) => {
      logger.error("shopping write failed", error)
      if (context?.previous) queryClient.setQueryData(queryKeys.shopping, context.previous)
      showToast(t("failed"), "error")
    },
    onSuccess: () => { if (toast) showToast(t(toast), "success") },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.shopping }),
  })
}

export const useAddShopping = () => useShoppingWrite(addShopping, "added")
// Ticking is instant (optimistic) and silent: no toast for every item in the shop
export const useCheckShopping = () =>
  useShoppingWrite(setShoppingChecked, null, (items, { ids, checked }) => items.map((i) => (ids.includes(i.id) ? { ...i, checked } : i)))
export const useClearShopping = () =>
  useShoppingWrite(removeShopping, "cleared", (items, which) => (which === "all" ? [] : items.filter((i) => !i.checked)))
