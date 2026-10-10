import { lazy, Suspense, useState } from "react"
import { useLocale, useTranslations } from "use-intl"
import { DishRecipeGenerate } from "@/components/pages/dish/DishRecipeGenerate"
import { Button } from "@/components/ui/Button"
import { IconAlert, IconEdit } from "@/components/ui/Icons"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { usePeople } from "@/hooks/usePeople"
import { useTranslateRecipe } from "@/hooks/useRecipe"
import { useAddShopping } from "@/hooks/useShopping"
import { ingredientsToShopping } from "@/services/shopping"
import { useSettings } from "@/hooks/useSettings"
import type { Dish } from "@/types/dish"
import type { Recipe } from "@/types/recipe"
import { findAllergens } from "@/utils/allergens"
import { existingDiners } from "@/utils/people"
import { hostOf } from "@/utils/recipes"

// Opened on demand: its own chunk (14-PERFORMANCE)
const DishCooking = lazy(() => import("@/components/pages/dish/DishCooking").then((m) => ({ default: m.DishCooking })))

// Read while cooking: ingredients on a note card, numbered steps in big type. The allergy
// safety net (brief §3.8) checks every ingredient against the usual diners' allergens.
export const DishRecipeView = ({ dish, recipe, onEdit }: { dish: Dish; recipe: Recipe; onEdit: () => void }) => {
  const t = useTranslations("dish.recipe")
  const [cooking, setCooking] = useState(false)
  const locale = useLocale()
  const translate = useTranslateRecipe()
  const addShopping = useAddShopping()
  const label = useCatalogueLabel()
  const { data: people = [] } = usePeople()
  const { data: settings } = useSettings()
  const usual = existingDiners(settings?.defaultDiners ?? [], people)
  const diners = people.filter((p) => (usual.length ? usual.includes(p.id) : p.isMe))
  const allergens = findAllergens(
    recipe.ingredients.map((i) => i.item),
    diners.flatMap((p) => p.restrictions.filter((r) => r.kind === "allergy")),
  )

  return (
    <div className="flex flex-col gap-8">
      {recipe.language !== locale && (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-2 p-3">
          <span className="text-body-sm">{t("otherLanguage")}</span>
          <Button variant="outlined" size="sm" loading={translate.isPending}
            onClick={() => translate.mutate({ dishId: dish.id, language: locale })}>
            {t("translate")}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {recipe.steps.length > 0 && <Button size="lg" onClick={() => setCooking(true)}>{t("cook")}</Button>}
        {recipe.ingredients.length > 0 && (
          <Button size="lg" variant="outlined" loading={addShopping.isPending}
            onClick={() => addShopping.mutate(ingredientsToShopping(recipe.ingredients, dish.id))}>
            {t("toShopping")}
          </Button>
        )}
      </div>
      {cooking && (
        <Suspense fallback={null}>
          <DishCooking name={dish.name} recipe={recipe} onClose={() => setCooking(false)} />
        </Suspense>
      )}
      <p className="text-label">
        {t("for", { count: recipe.servings })}
        {recipe.prepMinutes ? ` · ${t("minutes", { count: recipe.prepMinutes })}` : ""}
        {" · "}
        {recipe.sourceUrl ? (
          <>
            {recipe.source === "mine" && `${t("source.mine")}, `}
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="keyboard-focus-ring rounded-sm text-primary underline underline-offset-4">
              {t(recipe.source === "mine" ? "adaptedFrom" : "from", { site: hostOf(recipe.sourceUrl) })}
            </a>
          </>
        ) : t(`source.${recipe.source}`)}
      </p>

      {allergens.length > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-surface-2 p-3 text-body text-danger">
          <IconAlert className="mt-1 h-4 w-4 shrink-0" />
          {t("allergenWarning", { allergens: allergens.map((a) => a.label ?? label("allergy", a.key)).join(", ") })}
        </p>
      )}

      {recipe.equipment.length > 0 && (
        <ul aria-label={t("equipment")} className="flex flex-wrap gap-2">
          {recipe.equipment.map((e) => <li key={e} className="text-body-sm rounded-full bg-sage-soft px-3 py-1">{label("equipment", e)}</li>)}
        </ul>
      )}

      {/* Ingredients span the column — two columns of them from md up, quantities lined up in
          their own track — and the steps follow at a comfortable reading width. */}
      <div className="flex flex-col gap-10">
        <div className="-rotate-[0.5deg] rounded-sm bg-paper p-5 shadow-md lg:p-7">
          <h3 className="text-voice-lg">{t("ingredients")}</h3>
          <ul className="mt-4 md:columns-2 md:gap-10">
            {recipe.ingredients.map((i, n) => (
              <li key={n} className="text-body mb-3 grid break-inside-avoid grid-cols-[minmax(4.5rem,auto)_1fr] gap-x-3">
                <span className="text-accent-strong">{i.quantity}</span>
                <span>{i.item}</span>
              </li>
            ))}
          </ul>
        </div>
        <ol className="flex max-w-[65ch] flex-col gap-6">
          {recipe.steps.map((step, n) => (
            <li key={n} className="flex gap-4">
              <span aria-hidden="true" className="text-voice-lg w-8 shrink-0 text-primary">{n + 1}</span>
              <p className="text-body pt-1.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        <Button variant="outlined" onClick={onEdit} icon={<IconEdit className="h-4 w-4 shrink-0" />} className="self-start">{t("edit")}</Button>
        <DishRecipeGenerate dish={dish} label={t("rewrite")} initialServings={recipe.servings} />
      </div>
    </div>
  )
}
