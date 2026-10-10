import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { getSettings, saveSettings } from "@/services/settings"
import { showToast } from "@/stores/toast-store"
import type { AppSettings } from "@/types/person"
import { logger } from "@/utils/logger"

export const useSettings = () =>
  useQuery({ queryKey: queryKeys.settings, queryFn: getSettings, staleTime: 5 * 60_000, meta: { persist: true } })

export const useSaveSettings = () => {
  const t = useTranslations("settings.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveSettings,
    onMutate: async (patch: Partial<AppSettings>) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings })
      const previous = queryClient.getQueryData<AppSettings>(queryKeys.settings)
      if (previous) queryClient.setQueryData(queryKeys.settings, { ...previous, ...patch })
      return { previous }
    },
    onError: (error, _patch, context) => {
      logger.error("settings write failed", error)
      if (context?.previous) queryClient.setQueryData(queryKeys.settings, context.previous)
      showToast(t("failed"), "error")
    },
    onSuccess: () => showToast(t("saved"), "success"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
  })
}
