import { useLocale, useTranslations } from "use-intl"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"
import type { MonthRecap } from "@/types/meal"
import { initialOf } from "@/utils/people"

// The three most eaten dishes as pinned photos, the winner biggest; each opens its dish page
const PLACES = [
  { size: "w-full", tilt: "-rotate-2", rank: "text-display" },
  { size: "w-4/5", tilt: "rotate-2", rank: "text-title" },
  { size: "w-3/5", tilt: "-rotate-1", rank: "text-heading" },
] as const

export const RecapPodium = ({ recap }: { recap: MonthRecap }) => {
  const t = useTranslations("recap.podium")
  const locale = useLocale()
  return (
    <section aria-labelledby="recap-podium" data-anim="rise" className="invisible flex flex-col gap-5">
      <h2 id="recap-podium" className="text-label">{t("title")}</h2>
      {recap.top.length === 0 ? (
        <p className="text-note text-text-muted">{t("empty")}</p>
      ) : (
        <ol className="grid grid-cols-3 items-end gap-4 lg:gap-8">
          {recap.top.map((dish, i) => {
            const place = PLACES[i] ?? PLACES[2]
            return (
              <li key={dish.dishId} className="flex flex-col items-center gap-2">
                <TransitionLink href={localizedPath("dish", locale, { dishId: dish.dishId })}
                  className={`keyboard-focus-ring group flex flex-col items-center gap-2 rounded-sm ${place.size}`}>
                  {dish.imageUrl ? (
                    <img src={dish.imageUrl} alt="" width={320} height={320} loading="lazy" decoding="async"
                      className={`photo-frame aspect-square w-full transition-transform group-hover:-translate-y-1 ${place.tilt}`} />
                  ) : (
                    <span aria-hidden="true" className={`flex aspect-square w-full items-center justify-center rounded-sm border-6 border-surface bg-paper shadow-lg ${place.tilt}`}>
                      <span className="text-voice-lg text-accent">{initialOf(dish.name)}</span>
                    </span>
                  )}
                  <span className={`text-primary ${place.rank}`}>{i + 1}</span>
                  <span className="text-note line-clamp-2 text-center">{dish.name}</span>
                </TransitionLink>
                <span className="text-body-sm">{t("times", { count: dish.count })}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
