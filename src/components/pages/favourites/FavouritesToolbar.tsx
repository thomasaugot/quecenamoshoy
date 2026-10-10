import { useTranslations } from "use-intl"
import { Chip } from "@/components/ui/Chip"
import { Input } from "@/components/ui/Input"
import { usePeople } from "@/hooks/usePeople"
import { useFavouritesStore } from "@/stores/favourites-store"

// Search, and whose favourites to show. "Todos" = every dish.
export const FavouritesToolbar = () => {
  const t = useTranslations("favourites.toolbar")
  const { data: people = [] } = usePeople()
  const { query, personId, setQuery, setPersonId } = useFavouritesStore()
  return (
    <div data-anim="rise" className="invisible flex flex-col gap-4 md:flex-row md:items-end md:gap-8">
      <div className="md:w-80">
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
      {people.length > 1 && (
        <div role="group" aria-label={t("whose")} className="flex flex-wrap gap-2">
          <Chip tone="diet" pressed={personId === null} onClick={() => setPersonId(null)}>{t("all")}</Chip>
          {people.map((p) => (
            <Chip key={p.id} tone="hard" pressed={personId === p.id} onClick={() => setPersonId(p.id)}>{p.name}</Chip>
          ))}
        </div>
      )}
    </div>
  )
}
