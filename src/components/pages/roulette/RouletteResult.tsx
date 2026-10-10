import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useCreateMeal } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { useSpin } from "@/hooks/useSpin"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { useRouletteStore } from "@/stores/roulette-store"
import { isoDaysAgo } from "@/utils/dates"
import { initialOf } from "@/utils/people"

// What the wheel picked, once it has stopped: "Cenamos esto" or spin again with the same
// preference (brief §3.7).
export const RouletteResult = () => {
  const t = useTranslations("roulette.result")
  const locale = useLocale()
  const now = useNow()
  const { navigateTo } = useTransition()
  const { slots, winner, spinning, location, diners, guests } = useRouletteStore()
  const spin = useSpin()
  const create = useCreateMeal()
  const dish = winner !== null && !spinning ? slots[winner]?.dish : undefined
  if (!dish) return null

  const eat = () =>
    create.mutate(
      { dishId: dish.id, newDishName: null, eatenOn: isoDaysAgo(0, now), diners, guests, location, rating: null, note: null, withLeftovers: false },
      { onSuccess: () => void navigateTo(localizedPath("history", locale)) },
    )

  return (
    <article aria-live="polite" aria-labelledby="roulette-winner"
      className="flex w-full max-w-xl items-center gap-5 rounded-xl bg-paper p-4 shadow-lg lg:gap-4">
      {dish.imageUrl ? (
        <img src={dish.imageUrl} alt="" width={160} height={160} decoding="async" className="photo-frame aspect-square w-20 shrink-0 -rotate-3" />
      ) : (
        <div aria-hidden="true" className="flex aspect-square w-20 shrink-0 -rotate-3 items-center justify-center rounded-sm border-6 border-surface bg-surface-2 shadow-md">
          <span className="text-voice-lg text-accent">{initialOf(dish.name)}</span>
        </div>
      )}
      <div className="flex min-w-0 grow flex-col gap-2">
        <p className="text-note text-primary">{t("tonight")}</p>
        <h2 id="roulette-winner" className="text-subheading">{dish.name}</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={eat} loading={create.isPending}>{t("eat")}</Button>
          <Button variant="outlined" onClick={spin}>{t("again")}</Button>
        </div>
      </div>
    </article>
  )
}
