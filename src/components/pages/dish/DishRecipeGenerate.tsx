import { useState } from "react"
import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Stepper } from "@/components/ui/Stepper"
import { RECIPE_SERVINGS_MAX } from "@/constants/dish"
import { useGenerateRecipe } from "@/hooks/useRecipe"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"
import type { Dish } from "@/types/dish"
import { existingDiners } from "@/utils/people"

// Ask Gemini for the recipe, for how many people (written for the usual diners' restrictions)
export const DishRecipeGenerate = ({ dish, label, initialServings }: { dish: Dish; label: string; initialServings?: number }) => {
  const t = useTranslations("dish.recipe")
  const locale = useLocale()
  const { data: people = [] } = usePeople()
  const { data: settings } = useSettings()
  const usual = existingDiners(settings?.defaultDiners ?? [], people)
  const diners = usual.length ? usual : people.filter((p) => p.isMe).map((p) => p.id)
  const [servings, setServings] = useState(initialServings ?? Math.max(2, diners.length))
  const generate = useGenerateRecipe()

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Stepper value={servings} min={1} max={RECIPE_SERVINGS_MAX} onChange={setServings}
        label={t("servings")} decreaseLabel={t("fewer")} increaseLabel={t("more")} unit={t("people")} />
      <Button loading={generate.isPending} onClick={() => generate.mutate({ dishId: dish.id, servings, diners, language: locale })}>
        {generate.isPending ? t("writing") : label}
      </Button>
    </div>
  )
}
