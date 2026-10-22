import { useFormatter, useTranslations } from "use-intl"
import { DishPhotoButton } from "@/components/pages/dish/DishPhotoButton"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useLastEaten } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { LAST_EATEN_LOOKBACK_DAYS } from "@/constants/home"
import type { Dish } from "@/types/dish"
import { dateFromIso, isoDaysAgo } from "@/utils/dates"
import { initialOf } from "@/utils/people"

// The dish itself: its photo pinned like a snapshot, what it is, who loves it, when we last had it.
export const DishHero = ({ dish }: { dish: Dish }) => {
  const t = useTranslations("dish.hero")
  const label = useCatalogueLabel()
  const format = useFormatter()
  const now = useNow()
  const { data: people = [] } = usePeople()
  const { data: lastEaten } = useLastEaten(isoDaysAgo(LAST_EATEN_LOOKBACK_DAYS, now))
  const lovers = people.filter((p) => dish.lovedBy.includes(p.id)).map((p) => p.name)
  const last = lastEaten?.[dish.id]
  const tags = [
    ...dish.proteins.map((x) => label("protein", x)),
    ...dish.traits.map((tr) => label("trait", tr)),
    ...dish.tags,
    ...(dish.temp ? [label("temp", dish.temp)] : []),
  ]

  return (
    <header className="flex flex-col gap-6">
      {/* the wrapper is what animates: a photo uploaded here swaps the img in after the entrance */}
      <div data-anim="pin" className="invisible w-full max-w-sm">
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt="" width={640} height={640} fetchPriority="high" decoding="async"
            className="photo-frame aspect-square w-full -rotate-2" />
        ) : (
          <div aria-hidden="true"
            className="flex aspect-square w-full -rotate-2 items-center justify-center rounded-sm border-8 border-surface bg-paper shadow-lg">
            <span className="text-display text-accent">{initialOf(dish.name)}</span>
          </div>
        )}
      </div>
      <div data-anim="rise" className="invisible flex flex-col gap-3">
        <h1 className="text-title">{dish.name}</h1>
        {dish.description && <p className="text-body text-text-soft">{dish.description}</p>}
        {tags.length > 0 && (
          <ul aria-label={t("tags")} className="flex flex-wrap gap-2">
            {tags.map((tag) => <li key={tag} className="text-body-sm rounded-full bg-surface-2 px-3 py-1">{tag}</li>)}
          </ul>
        )}
        <p className="text-note text-accent-strong">
          {lovers.length ? t("lovedBy", { names: lovers.join(" & ") }) : t("nobody")}
          {" · "}
          {last ? t("lastEaten", { when: format.relativeTime(dateFromIso(last), now) }) : t("neverEaten")}
        </p>
      </div>
      <div data-anim="rise" className="invisible"><DishPhotoButton dishId={dish.id} /></div>
    </header>
  )
}
