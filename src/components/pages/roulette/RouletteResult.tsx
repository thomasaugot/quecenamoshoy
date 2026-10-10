import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useRouletteWinner } from "@/hooks/useRouletteWinner"
import { initialOf } from "@/utils/people"

// Desktop: what the wheel picked, under it. Phones get it as a sheet (RouletteResultSheet).
export const RouletteResult = () => {
  const t = useTranslations("roulette.result")
  const { dish, eat, eating, again } = useRouletteWinner()
  if (!dish) return null

  return (
    <article aria-live="polite" aria-labelledby="roulette-winner"
      className="hidden w-full max-w-xl items-center gap-4 rounded-xl bg-paper p-4 shadow-lg lg:flex">
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
          <Button onClick={eat} loading={eating}>{t("eat")}</Button>
          <Button variant="outlined" onClick={again}>{t("again")}</Button>
        </div>
      </div>
    </article>
  )
}
