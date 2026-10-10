import { useTranslations } from "use-intl"
import { FavouritesCard } from "@/components/pages/favourites/FavouritesCard"
import { useDishes } from "@/hooks/useDishes"
import { useFavouritesStore } from "@/stores/favourites-store"
import { filterDishes, sortByLove } from "@/utils/dishes"

// A wall of pinned photos. Only the wall is animated: cards come and go with the filter,
// and a card mounted after the entrance would stay `invisible`.
export const FavouritesGrid = () => {
  const t = useTranslations("favourites.grid")
  const { data: dishes = [] } = useDishes()
  const query = useFavouritesStore((s) => s.query)
  const personId = useFavouritesStore((s) => s.personId)
  const shown = sortByLove(filterDishes(dishes, { query, personId }))

  return (
    <section aria-label={t("label")} data-anim="rise" className="invisible">
      {shown.length === 0 ? (
        <p className="text-note text-text-muted">{dishes.length === 0 ? t("empty") : t("noMatch")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
          {shown.map((dish, i) => (
            <li key={dish.id} className="flex min-w-0"><FavouritesCard dish={dish} index={i} /></li>
          ))}
        </ul>
      )}
    </section>
  )
}
