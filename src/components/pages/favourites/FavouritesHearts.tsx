import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useSetFavourite } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import type { Dish } from "@/types/dish"
import { initialOf } from "@/utils/people"

// One small round token per person at the table — their photo or initial; on = loves it. A tap switches.
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
            className={p.avatarUrl
              ? "relative h-10 w-10 overflow-hidden opacity-45 grayscale aria-pressed:opacity-100 aria-pressed:grayscale-0 aria-pressed:ring-2 aria-pressed:ring-accent-strong aria-pressed:ring-offset-2"
              : "text-note aria-pressed:border-accent-strong aria-pressed:bg-accent-strong aria-pressed:text-on-accent"}
          >
            {/* their photo fills the token (absolute: the button pads its label); in colour with a ring when they love it */}
            {p.avatarUrl ? <img src={p.avatarUrl} alt="" width={80} height={80} decoding="async" className="absolute inset-0 h-full w-full rounded-full object-cover" /> : initialOf(p.name)}
          </Button>
        )
      })}
    </div>
  )
}
