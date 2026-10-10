import { useFormatter, useLocale, useTranslations } from "use-intl"
import { Polaroid } from "@/components/ui/Polaroid"
import { PolaroidSkeletons } from "@/components/ui/PolaroidSkeletons"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { FORGOTTEN_AFTER_DAYS, FORGOTTEN_SHOWN, LAST_EATEN_LOOKBACK_DAYS } from "@/constants/home"
import { useDishes } from "@/hooks/useDishes"
import { useLastEaten } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { localizedPath } from "@/i18n/paths"
import { dateFromIso, isoDaysAgo } from "@/utils/dates"
import { forgottenFavourites } from "@/utils/home"

// "Hace tiempo que no…": favourites we love and haven't had for three weeks, a few per day —
// a nudge before opening the wizard. Animated as a block: its photos arrive after the entrance.
export const HomeForgotten = () => {
  const t = useTranslations("home.forgotten")
  const format = useFormatter()
  const locale = useLocale()
  const now = useNow()
  const { data: dishes = [] } = useDishes()
  const { data: lastEaten } = useLastEaten(isoDaysAgo(LAST_EATEN_LOOKBACK_DAYS, now))
  const shown = lastEaten
    ? forgottenFavourites(dishes, lastEaten, isoDaysAgo(FORGOTTEN_AFTER_DAYS, now), isoDaysAgo(0, now), FORGOTTEN_SHOWN)
    : []

  return (
    <section aria-labelledby="home-forgotten" data-anim="rise" className="invisible flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="home-forgotten" className="text-label">{t("title")}</h2>
        <TransitionLink href={localizedPath("favourites", locale)}
          className="keyboard-focus-ring text-body-sm rounded-md text-primary underline underline-offset-4 hover:text-primary-hover">
          {t("more")}
        </TransitionLink>
      </div>
      {!lastEaten && <PolaroidSkeletons count={4} />}
      {shown.length > 0 && (
        <ul className="-mx-6 scrollbar-none flex gap-5 overflow-x-auto px-6 pt-1 pb-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
          {shown.map((dish, i) => {
            const last = lastEaten?.[dish.id]
            return (
              <li key={dish.id} className="flex min-w-0 shrink-0 lg:shrink">
                <Polaroid imageUrl={dish.imageUrl} title={dish.name} index={i + 1} href={localizedPath("dish", locale, { dishId: dish.id })}
                  caption={last ? format.relativeTime(dateFromIso(last), now) : t("never")} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
