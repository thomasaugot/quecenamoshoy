import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { fetchHealthTips } from "@/services/health"
import { showToast } from "@/stores/toast-store"
import type { HealthTips } from "@/types/health"
import { RateLimitedError } from "@/utils/errors"
import { logger } from "@/utils/logger"

// The tips are asked for, never fetched on their own (each one is an AI call). Once there,
// they stay with their month in the cache, so coming back to the recap shows them again.
export const useHealthTips = (month: string) => {
  const t = useTranslations("recap.health.tips")
  const queryClient = useQueryClient()
  const saved = useQuery<HealthTips | null>({
    queryKey: queryKeys.health(month),
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    meta: { persist: true },
  })
  const ask = useMutation({
    mutationFn: fetchHealthTips,
    onSuccess: (tips) => queryClient.setQueryData(queryKeys.health(month), tips),
    onError: (error) => {
      if (error instanceof RateLimitedError) return showToast(t("limit"), "warning")
      logger.error("health tips failed", error)
      showToast(t("failed"), "error")
    },
  })
  return { tips: saved.data ?? null, ask }
}
