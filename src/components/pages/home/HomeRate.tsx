import { useId, useRef, useState } from "react"
import { useFormatter, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { RatingInput } from "@/components/ui/RatingInput"
import { RATE_ASK_DAYS } from "@/constants/meal"
import { useNow } from "@/hooks/useNow"
import { useRiseIn } from "@/hooks/useRiseIn"
import { useRateMeal, useUnratedMeal } from "@/hooks/useMeals"
import { dateFromIso, isoDaysAgo } from "@/utils/dates"
import { initialOf } from "@/utils/people"

// "La quiche d'hier, c'était comment ?" — the last dinner without stars, asked the next day.
// Stars and an optional note, then it's gone. Not rendered at all when there's nothing to ask
// It arrives after the page entrance, so it rises in on its own (useRiseIn).
export const HomeRate = () => {
  const t = useTranslations("home.rate")
  const tOut = useTranslations("history.meal.out")
  const format = useFormatter()
  const now = useNow()
  const noteId = useId()
  const { data: meal } = useUnratedMeal(isoDaysAgo(RATE_ASK_DAYS, now), isoDaysAgo(1, now))
  const rate = useRateMeal()
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  useRiseIn(rootRef, meal?.id ?? "none")
  if (!meal) return null

  const day = format.dateTime(dateFromIso(meal.eatenOn), { weekday: "long" })

  return (
    <div ref={rootRef}>
    <section aria-labelledby="home-rate" data-anim="step" className="invisible flex items-start gap-4 rounded-xl bg-paper p-4 shadow-md lg:p-5">
      {meal.imageUrl ? (
        <img src={meal.imageUrl} alt="" width={128} height={128} decoding="async" className="photo-frame-sm aspect-square w-16 shrink-0 -rotate-3" />
      ) : (
        <div aria-hidden="true" className="flex aspect-square w-16 shrink-0 -rotate-3 items-center justify-center rounded-xs border-3 border-surface bg-surface-2 shadow-sm">
          <span className="text-voice text-accent">{initialOf(meal.dishName || (meal.eatenOut ? tOut(meal.eatenOut) : ""))}</span>
        </div>
      )}
      <div className="flex min-w-0 grow flex-col gap-2">
        <h2 id="home-rate" className="text-note">{t("question", { dish: meal.dishName || (meal.eatenOut ? tOut(meal.eatenOut) : ""), day })}</h2>
        <RatingInput value={rating} onChange={setRating} label={t("label")} starLabel={(n) => t("stars", { count: n })} />
        {rating !== null && (
          <div className="flex flex-col gap-2">
            <div className="field-line flex flex-col gap-0.5">
              <label htmlFor={noteId} className="text-label">{t("note")}</label>
              <input id={noteId} name="rate-note" autoComplete="off" value={note} placeholder={t("notePlaceholder")}
                onChange={(e) => setNote(e.target.value)} maxLength={2000}
                className="keyboard-focus-ring text-body h-10 w-full bg-transparent placeholder:text-text-muted" />
            </div>
            <Button size="sm" loading={rate.isPending} className="self-start"
              onClick={() => rate.mutate({ id: meal.id, rating, note: note.trim() || null })}>{t("save")}</Button>
          </div>
        )}
      </div>
    </section>
    </div>
  )
}
