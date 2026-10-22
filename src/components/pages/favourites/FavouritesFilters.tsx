import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { PROTEINS, TEMPS, TRAITS } from "@/constants/dish"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useFavouritesStore } from "@/stores/favourites-store"
import { activeFilterCount } from "@/utils/dishes"

// What's in it, what it's like, hot or cold — the same words as the dish form.
export const FavouritesFilters = ({ id }: { id: string }) => {
  const t = useTranslations("favourites.toolbar")
  const tEditor = useTranslations("favourites.editor")
  const label = useCatalogueLabel()
  const { proteins, traits, temps, toggleProtein, toggleTrait, toggleTemp, clearFilters } = useFavouritesStore()
  const count = activeFilterCount({ proteins, traits, temps })

  return (
    <div id={id} role="group" aria-label={t("filters")}
      className="grid gap-x-10 gap-y-6 rounded-xl bg-surface-2 p-5 md:p-6 lg:[grid-template-columns:minmax(0,1fr)_minmax(0,1.4fr)_auto]">
      <fieldset>
        <legend className="text-label mb-3">{tEditor("protein")}</legend>
        <div className="flex flex-wrap gap-2">
          {PROTEINS.map((p) => (
            <Chip key={p} tone="diet" pressed={proteins.includes(p)} onClick={() => toggleProtein(p)}>{label("protein", p)}</Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-label mb-3">{tEditor("traits")}</legend>
        <div className="flex flex-wrap gap-2">
          {TRAITS.map((trait) => (
            <Chip key={trait} tone="soft" pressed={traits.includes(trait)} onClick={() => toggleTrait(trait)}>{label("trait", trait)}</Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-label mb-3">{t("temp")}</legend>
        <div className="flex flex-wrap gap-2">
          {TEMPS.map((temp) => (
            <Chip key={temp} tone="soft" pressed={temps.includes(temp)} onClick={() => toggleTemp(temp)}>{label("temp", temp)}</Chip>
          ))}
        </div>
      </fieldset>
      {count > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="justify-self-start lg:col-span-3">{t("clear")}</Button>
      )}
    </div>
  )
}
