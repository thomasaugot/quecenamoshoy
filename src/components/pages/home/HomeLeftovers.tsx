import { useRef } from "react"
import { useFormatter, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { LEFTOVERS_DAYS } from "@/constants/meal"
import { useRecentMeals } from "@/hooks/useHomeData"
import { useClearLeftovers, useEatLeftovers, useLeftoverMeal } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { useRiseIn } from "@/hooks/useRiseIn"
import { dateFromIso, isoDaysAgo } from "@/utils/dates"
import { initialOf } from "@/utils/people"

// "Il reste de la quiche d'hier": a dinner logged with leftovers comes back the next days,
// until we eat them (that logs tonight's dinner) or say the fridge is empty. Hidden once
// tonight's dinner is logged. Arrives after the page entrance, so it rises in on its own.
export const HomeLeftovers = () => {
  const t = useTranslations("home.leftovers")
  const format = useFormatter()
  const now = useNow()
  const todayIso = isoDaysAgo(0, now)
  const { data: meal } = useLeftoverMeal(isoDaysAgo(LEFTOVERS_DAYS, now), isoDaysAgo(1, now))
  const { data: recent = [] } = useRecentMeals()
  const eat = useEatLeftovers()
  const clear = useClearLeftovers()
  const rootRef = useRef<HTMLDivElement>(null)
  const shown = meal && !recent.some((m) => m.eatenOn === todayIso) ? meal : null
  useRiseIn(rootRef, shown?.id ?? "none")
  if (!shown) return null

  const day = format.dateTime(dateFromIso(shown.eatenOn), { weekday: "long" })

  return (
    <div ref={rootRef}>
      <section aria-labelledby="home-leftovers" data-anim="step" className="invisible flex items-start gap-4 rounded-xl bg-sage-soft p-4 shadow-md lg:p-5">
        {shown.imageUrl ? (
          <img src={shown.imageUrl} alt="" width={128} height={128} decoding="async" className="photo-frame-sm aspect-square w-16 shrink-0 rotate-3" />
        ) : (
          <div aria-hidden="true" className="flex aspect-square w-16 shrink-0 rotate-3 items-center justify-center rounded-xs border-3 border-surface bg-paper shadow-sm">
            <span className="text-voice text-accent">{initialOf(shown.dishName)}</span>
          </div>
        )}
        <div className="flex min-w-0 grow flex-col gap-3">
          <h2 id="home-leftovers" className="text-note">{t("question", { dish: shown.dishName, day })}</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={eat.isPending} onClick={() => eat.mutate({ meal: shown, todayIso })}>{t("eat")}</Button>
            <Button variant="ghost" size="sm" loading={clear.isPending} onClick={() => clear.mutate(shown.id)}>{t("gone")}</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
