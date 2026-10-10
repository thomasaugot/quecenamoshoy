import { useFormatter, useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconArrow } from "@/components/ui/Icons"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import type { MonthRecap } from "@/types/meal"
import { dateFromIso } from "@/utils/dates"
import { monthBounds, shiftMonth } from "@/utils/recap"

export const RecapHero = ({ month, recap }: { month: string; recap: MonthRecap }) => {
  const t = useTranslations("recap.hero")
  const format = useFormatter()
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const go = (by: number) => void navigateTo(`${localizedPath("recap", locale)}?month=${shiftMonth(month, by)}`)
  const title = format.dateTime(dateFromIso(monthBounds(month).from), { month: "long", year: "numeric" })

  return (
    <header className="flex flex-col gap-5">
      <div data-anim="rise" className="invisible flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" aria-label={t("previous")} onClick={() => go(-1)}
          icon={<IconArrow className="h-5 w-5 shrink-0 rotate-180" />} />
        <h1 className="text-title first-letter:uppercase">{title}</h1>
        <Button variant="ghost" size="icon" aria-label={t("next")} onClick={() => go(1)}
          icon={<IconArrow className="h-5 w-5 shrink-0" />} />
      </div>
      <p data-anim="rise" className="invisible flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-display text-accent">{recap.dinners}</span>
        <span className="text-voice-lg">{t("dinners", { count: recap.dinners })}</span>
        {recap.dinners > 0 && <span className="text-note text-text-soft">{t("dishes", { count: recap.dishes })}</span>}
      </p>
    </header>
  )
}
