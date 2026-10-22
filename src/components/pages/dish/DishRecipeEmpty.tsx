import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { DishRecipeGenerate } from "@/components/pages/dish/DishRecipeGenerate"
import { Button } from "@/components/ui/Button"
import { IconEdit } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { useImportRecipe } from "@/hooks/useRecipe"
import type { Dish } from "@/types/dish"
import { isRecipeUrl } from "@/utils/recipes"

// No recipe yet: Gemini writes one, I write my own, or I paste the link of one I like.
export const DishRecipeEmpty = ({ dish, onWrite }: { dish: Dish; onWrite: () => void }) => {
  const t = useTranslations("dish.recipe")
  const importRecipe = useImportRecipe()
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isRecipeUrl(url)) return setError(t("badUrl"))
    importRecipe.mutate({ dishId: dish.id, url: url.trim() })
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-note text-text-soft">{t("none")}</p>
      <DishRecipeGenerate dish={dish} label={t("generate")} />
      <Button variant="outlined" onClick={onWrite} icon={<IconEdit className="h-5 w-5 shrink-0" />} className="self-start">{t("writeMine")}</Button>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-xl bg-surface-2 p-5">
        <Input label={t("importLabel")} name="recipe-url" type="url" inputMode="url" autoComplete="off" placeholder="https://www.marmiton.org/…"
          value={url} onChange={(e) => { setUrl(e.target.value); setError(null) }} error={error ?? undefined} hint={t("importHint")} />
        <Button type="submit" variant="outlined" loading={importRecipe.isPending} className="self-start">{t("import")}</Button>
      </form>
    </div>
  )
}
