import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { acceptSuggestion, getSuggestions, saveSuggestion } from "@/services/suggest"
import { showToast } from "@/stores/toast-store"
import { useWizardStore } from "@/stores/wizard-store"
import { RateLimitedError } from "@/utils/errors"
import { logger } from "@/utils/logger"

export const useSuggest = () => {
  const t = useTranslations("wizard.toasts")
  const setSuggestions = useWizardStore((s) => s.setSuggestions)
  const setStatus = useWizardStore((s) => s.setStatus)
  // Status goes to the store: the question that fires the request and the results that show
  // it are different components, and a mutation's own state is per component.
  return useMutation({
    mutationFn: getSuggestions,
    onMutate: () => setStatus("loading"),
    onSuccess: setSuggestions,
    onError: (error) => {
      setStatus("error")
      if (error instanceof RateLimitedError) return showToast(t("rateLimited"), "warning")
      logger.error("suggest failed", error)
      showToast(t("failed"), "error")
    },
  })
}

export const useSaveSuggestion = () => {
  const t = useTranslations("wizard.toasts")
  const queryClient = useQueryClient()
  const markSaved = useWizardStore((s) => s.markSaved)
  return useMutation({
    mutationFn: saveSuggestion,
    onSuccess: (dishId, { suggestion }) => {
      markSaved(suggestion.name, dishId)
      showToast(t("saved"), "success")
    },
    onError: (error) => {
      logger.error("save suggestion failed", error)
      showToast(t("saveFailed"), "error")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
  })
}

export const useAcceptSuggestion = () => {
  const t = useTranslations("wizard.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptSuggestion,
    onSuccess: () => showToast(t("accepted"), "success"),
    onError: (error) => {
      logger.error("accept suggestion failed", error)
      showToast(t("saveFailed"), "error")
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
    ]),
  })
}
