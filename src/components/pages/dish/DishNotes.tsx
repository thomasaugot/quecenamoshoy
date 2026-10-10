import { useFormatter, useTranslations } from "use-intl"
import { RatingStars } from "@/components/ui/RatingStars"
import { useDishNotes } from "@/hooks/useMeals"
import { dateFromIso } from "@/utils/dates"

// "La dernière fois…": what I wrote after we last ate it — "en faire plus", "sans tomates" —
// pinned above the recipe so I read it before cooking. Older notes underneath, smaller.
export const DishNotes = ({ dishId }: { dishId: string }) => {
  const t = useTranslations("dish.notes")
  const format = useFormatter()
  const { data: notes = [] } = useDishNotes(dishId)
  const [latest, ...earlier] = notes
  if (!latest) return null
  const date = (iso: string) => format.dateTime(dateFromIso(iso), { day: "numeric", month: "long", year: "numeric" })

  return (
    <aside aria-labelledby="dish-notes" className="rotate-1 flex flex-col gap-3 rounded-sm bg-highlight/40 p-5 shadow-md lg:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="dish-notes" className="text-voice-lg">{t("title")}</h2>
        <span className="text-body-sm">{date(latest.eatenOn)}</span>
      </div>
      {latest.rating !== null && <RatingStars value={latest.rating} label={t("rating", { rating: latest.rating })} />}
      {latest.note && <p className="text-voice text-text">“{latest.note}”</p>}
      {earlier.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-label">{t("earlier")}</p>
          <ul className="flex flex-col gap-2">
            {earlier.map((n) => (
              <li key={n.id} className="flex flex-col gap-0.5">
                <span className="text-body-sm">
                  {date(n.eatenOn)}
                  {n.rating !== null && ` · ${"★".repeat(n.rating)}`}
                </span>
                {n.note && <span className="text-note text-text-soft">“{n.note}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
