import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useSetFavourite } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import type { Dish } from "@/types/dish"
import { initialOf } from "@/utils/people"

// One small round token per person at the table: filled terracotta = loves it. A tap switches.
export const FavouritesHearts = ({ dish }: { dish: Dish }) => {
  const t = useTranslations("favourites.card")
  const { data: people = [] } = usePeople()
  const setFavourite = useSetFavourite()
  return (
    <div role="group" aria-label={t("lovedBy")} className="flex flex-wrap gap-1.5">
      {people.map((p) => {
        const on = dish.lovedBy.includes(p.id)
        return (
          <Button
            key={p.id}
            variant="outlined"
            size="icon"
            aria-pressed={on}
            aria-label={t("love", { name: p.name })}
            onClick={() => setFavourite.mutate({ dishId: dish.id, personId: p.id, on: !on })}
            className="text-note aria-pressed:border-accent-strong aria-pressed:bg-accent-strong aria-pressed:text-on-accent"
          >
            {initialOf(p.name)}
          </Button>
        )
      })}
    </div>
  )
}
