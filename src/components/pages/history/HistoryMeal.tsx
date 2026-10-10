import { useFormatter, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconEdit } from "@/components/ui/Icons"
import { RatingStars } from "@/components/ui/RatingStars"
import { usePeople } from "@/hooks/usePeople"
import { useHistoryStore } from "@/stores/history-store"
import type { Meal } from "@/types/meal"
import { dateFromIso } from "@/utils/dates"
import { initialOf } from "@/utils/people"

const TILTS = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-1"] as const

// One dinner: the photo pinned at the edge, the day in handwriting, who was there, the stars
// and the note scribbled under it.
export const HistoryMeal = ({ meal, index }: { meal: Meal; index: number }) => {
  const t = useTranslations("history.meal")
  const format = useFormatter()
  const { data: people = [] } = usePeople()
  const openEditor = useHistoryStore((s) => s.openEditor)
  const diners = people.filter((p) => meal.diners.includes(p.id))
  const tilt = TILTS[index % TILTS.length]
  // eaten out with no dish named: the kind of outing is the title
  const title = meal.dishName || (meal.eatenOut ? t(`out.${meal.eatenOut}`) : "")
  const out = meal.eatenOut ? [t(`out.${meal.eatenOut}`), meal.place].filter(Boolean).join(" · ") : null

  return (
    <article aria-labelledby={`meal-${meal.id}`} className="flex items-start gap-4 rounded-lg bg-surface p-3 shadow-sm lg:gap-5 lg:p-4">
      {meal.imageUrl ? (
        <img src={meal.imageUrl} alt="" width={160} height={160} loading="lazy" decoding="async"
          className={`photo-frame-sm aspect-square w-20 shrink-0 lg:w-24 ${tilt}`} />
      ) : (
        <div aria-hidden="true" className={`flex aspect-square w-20 shrink-0 items-center justify-center rounded-xs border-3 border-surface bg-paper shadow-sm lg:w-24 ${tilt}`}>
          <span className="text-voice-lg text-accent">{initialOf(title)}</span>
        </div>
      )}
      <div className="flex min-w-0 grow flex-col gap-1">
        <p className="text-note text-accent-strong">
          {format.dateTime(dateFromIso(meal.eatenOn), { weekday: "long", day: "numeric" })}
          {meal.location === "travel" && <span className="text-body-sm"> · {t("travel")}</span>}
          {out && title !== out && <span className="text-body-sm"> · {out}</span>}
        </p>
        <h4 id={`meal-${meal.id}`} className="text-subheading line-clamp-2">{title}</h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {meal.rating !== null && <RatingStars value={meal.rating} label={t("rating", { rating: meal.rating })} />}
          {diners.length > 0 && (
            <span className="text-body-sm">
              {diners.map((d) => d.name).join(" · ")}
              {meal.guests > 0 && ` ${t("guests", { count: meal.guests })}`}
            </span>
          )}
        </div>
        {meal.note && <p className="text-note text-text-soft">“{meal.note}”</p>}
      </div>
      <Button variant="ghost" size="icon" aria-label={t("edit", { name: title })}
        onClick={() => openEditor(meal.id)} icon={<IconEdit className="h-4 w-4 shrink-0" />} className="shrink-0 text-text-muted" />
    </article>
  )
}
