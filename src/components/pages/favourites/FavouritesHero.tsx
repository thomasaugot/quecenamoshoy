import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { unsortedDishes } from "@/utils/dishes"
import { useDishes, useEnrichDishes } from "@/hooks/useDishes"
import { useFavouritesStore } from "@/stores/favourites-store"

export const FavouritesHero = () => {
  const t = useTranslations("favourites.hero")
  const { data: dishes = [] } = useDishes()
  const openEditor = useFavouritesStore((s) => s.openEditor)
  const setImporting = useFavouritesStore((s) => s.setImporting)
  const tImport = useTranslations("favourites.import")
  const locale = useLocale()
  const enrich = useEnrichDishes()
  const unsorted = unsortedDishes(dishes).length
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div data-anim="rise" className="invisible">
        <h1 className="text-title">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h1>
        <p className="text-voice mt-2">{t("count", { count: dishes.length })}</p>
      </div>
      <div data-anim="rise" className="invisible flex flex-wrap gap-2">
        {unsorted > 0 && (
          <Button variant="outlined" loading={enrich.isPending} onClick={() => enrich.mutate(locale)}>
            {t("sort", { count: unsorted })}
          </Button>
        )}
        <Button variant="outlined" onClick={() => setImporting(true)}>{tImport("importLink")}</Button>
        <Button onClick={() => openEditor("new")} icon={<IconPlus className="h-5 w-5 shrink-0" />}>{t("add")}</Button>
      </div>
    </header>
  )
}
