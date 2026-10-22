import { useTranslations } from "use-intl"
import { FavouritesFilters } from "@/components/pages/favourites/FavouritesFilters"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { IconFilter } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { usePeople } from "@/hooks/usePeople"
import { useFavouritesStore } from "@/stores/favourites-store"
import { activeFilterCount } from "@/utils/dishes"

const FILTERS_ID = "favourites-filters"

// Search, whose favourites to show ("Todos" = every dish), and the dish filters.
export const FavouritesToolbar = () => {
  const t = useTranslations("favourites.toolbar")
  const { data: people = [] } = usePeople()
  const { query, personId, proteins, traits, temps, filtersOpen, setQuery, setPersonId, setFiltersOpen } = useFavouritesStore()
  const count = activeFilterCount({ proteins, traits, temps })
  return (
    <div data-anim="rise" className="invisible flex flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-8">
        <div className="flex items-end gap-3 md:w-[26rem]">
          <div className="grow">
            <Input
              label={t("search")}
              name="search"
              type="search"
              autoComplete="off"
              placeholder={t("placeholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button variant="outlined" aria-expanded={filtersOpen} aria-controls={FILTERS_ID}
            onClick={() => setFiltersOpen(!filtersOpen)} icon={<IconFilter className="h-5 w-5 shrink-0" />}
            className="aria-expanded:bg-surface-2">
            {t("filter")}
            {count > 0 && (
              <span className="text-body-sm ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-on-primary!">{count}</span>
            )}
          </Button>
        </div>
        {people.length > 1 && (
          <div role="group" aria-label={t("whose")} className="flex flex-wrap gap-2">
            <Chip tone="diet" pressed={personId === null} onClick={() => setPersonId(null)}>{t("all")}</Chip>
            {people.map((p) => (
              <Chip key={p.id} tone="hard" pressed={personId === p.id} onClick={() => setPersonId(p.id)}>{p.name}</Chip>
            ))}
          </div>
        )}
      </div>
      {filtersOpen && <FavouritesFilters id={FILTERS_ID} />}
    </div>
  )
}
