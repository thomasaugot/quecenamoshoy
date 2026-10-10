import { useState, type FormEvent } from "react"
import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { useImportRecipe } from "@/hooks/useRecipe"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { useFavouritesStore } from "@/stores/favourites-store"
import { isRecipeUrl } from "@/utils/recipes"

// Paste a link to a recipe I found online: it becomes one of my dishes (photo, recipe,
// favourite), and its page opens.
export const FavouritesImport = () => {
  const t = useTranslations("favourites.import")
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const importing = useFavouritesStore((s) => s.importing)
  const setImporting = useFavouritesStore((s) => s.setImporting)
  const importRecipe = useImportRecipe()
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!isRecipeUrl(url)) return setError(t("badUrl"))
    importRecipe.mutate({ url: url.trim() }, {
      onSuccess: (dishId) => {
        setImporting(false)
        void navigateTo(localizedPath("dish", locale, { dishId }))
      },
    })
  }

  return (
    <Modal isOpen={importing} onClose={() => setImporting(false)} title={t("importTitle")}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Input label={t("importLabel")} name="recipe-url" type="url" inputMode="url" autoComplete="off" autoFocus
          placeholder="https://www.marmiton.org/…" value={url} hint={t("importHint")}
          onChange={(e) => { setUrl(e.target.value); setError(null) }} error={error ?? undefined} />
        <Button type="submit" loading={importRecipe.isPending} className="self-start">{t("import")}</Button>
      </form>
    </Modal>
  )
}
