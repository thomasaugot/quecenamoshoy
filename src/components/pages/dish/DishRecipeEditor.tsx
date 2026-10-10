import { useId, useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Stepper } from "@/components/ui/Stepper"
import { RECIPE_SERVINGS_MAX } from "@/constants/dish"
import { useSaveRecipe } from "@/hooks/useRecipe"
import type { Recipe } from "@/types/recipe"
import { ingredientsFromText, stepsFromText, toDraft } from "@/utils/recipes"

// Edit by hand, as plain text: one ingredient per line ("200 g — harina"), one step per line.
export const DishRecipeEditor = ({ dishId, recipe, onDone }: { dishId: string; recipe: Recipe; onDone: () => void }) => {
  const t = useTranslations("dish.recipe")
  const ingredientsId = useId()
  const stepsId = useId()
  const [draft, setDraft] = useState(() => toDraft(recipe))
  const save = useSaveRecipe()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate({
      dishId, servings: draft.servings, prepMinutes: draft.prepMinutes,
      ingredients: ingredientsFromText(draft.ingredientsText), steps: stepsFromText(draft.stepsText),
    }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Stepper value={draft.servings} min={1} max={RECIPE_SERVINGS_MAX} onChange={(servings) => setDraft((d) => ({ ...d, servings }))}
        label={t("servings")} decreaseLabel={t("fewer")} increaseLabel={t("more")} unit={t("people")} />
      <div className="field-line flex flex-col gap-0.5">
        <label htmlFor={ingredientsId} className="text-label">{t("ingredientsEdit")}</label>
        <textarea id={ingredientsId} name="ingredients" rows={10} value={draft.ingredientsText}
          onChange={(e) => setDraft((d) => ({ ...d, ingredientsText: e.target.value }))}
          className="keyboard-focus-ring text-body w-full resize-y bg-transparent py-2" />
      </div>
      <div className="field-line flex flex-col gap-0.5">
        <label htmlFor={stepsId} className="text-label">{t("stepsEdit")}</label>
        <textarea id={stepsId} name="steps" rows={12} value={draft.stepsText}
          onChange={(e) => setDraft((d) => ({ ...d, stepsText: e.target.value }))}
          className="keyboard-focus-ring text-body w-full resize-y bg-transparent py-2" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>{t("save")}</Button>
        <Button variant="ghost" onClick={onDone}>{t("cancel")}</Button>
      </div>
    </form>
  )
}
