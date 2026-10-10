import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { generateRecipe, getRecipe, importRecipe, saveRecipe } from "@/services/recipes"
import { uploadDishPhoto } from "@/services/storage"
import { showToast } from "@/stores/toast-store"
import { RateLimitedError, RecipeImportError } from "@/utils/errors"
import { logger } from "@/utils/logger"

export const useRecipe = (dishId: string) =>
  useQuery({ queryKey: queryKeys.recipes.byDish(dishId), queryFn: () => getRecipe(dishId), staleTime: 30 * 60_000, meta: { persist: true } })

const useRecipeWrite = <V, R>(write: (vars: V) => Promise<R>, ok: "generated" | "imported" | "saved") => {
  const t = useTranslations("dish.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: write,
    onSuccess: () => showToast(t(ok), "success"),
    onError: (error) => {
      if (error instanceof RateLimitedError) return showToast(t("limit"), "warning")
      if (error instanceof RecipeImportError) return showToast(t(error.reason === "no_recipe" ? "noRecipe" : "unreachable"), "warning")
      logger.error("recipe write failed", error)
      showToast(t("failed"), "error")
    },
    // an import can create a dish (and its photo) too
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
    ]),
  })
}

export const useGenerateRecipe = () => useRecipeWrite(generateRecipe, "generated")
export const useImportRecipe = () => useRecipeWrite(importRecipe, "imported")
export const useSaveRecipe = () => useRecipeWrite(saveRecipe, "saved")

export const useUploadDishPhoto = () => {
  const t = useTranslations("dish.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadDishPhoto,
    onSuccess: () => showToast(t("photo"), "success"),
    onError: (error) => {
      logger.error("photo upload failed", error)
      showToast(t("photoFailed"), "error")
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
    ]),
  })
}
