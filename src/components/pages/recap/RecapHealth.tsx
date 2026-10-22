import { useTranslations } from "use-intl"
import { RecapHealthFigure } from "@/components/pages/recap/RecapHealthFigure"
import { RecapHealthTips } from "@/components/pages/recap/RecapHealthTips"
import { HEALTH_MIN_DINNERS } from "@/constants/health"
import type { HealthReport } from "@/types/health"
import { sortForAttention } from "@/utils/health"

// The month against general guidance: what to work on first, then what's fine, and the AI's
// read of it. Figures from the dinners logged here — the page says it is not medical advice.
export const RecapHealth = ({ month, report }: { month: string; report: HealthReport }) => {
  const t = useTranslations("recap.health")
  return (
    <section aria-labelledby="recap-health" data-anim="rise" className="invisible flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id="recap-health" className="text-heading">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h2>
        <p className="text-body-sm max-w-[60ch]">{t("intro")}</p>
      </div>
      {report.dinners < HEALTH_MIN_DINNERS ? (
        <p className="text-note text-text-soft">{t("notEnough", { count: HEALTH_MIN_DINNERS })}</p>
      ) : (
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
          <div className="flex flex-col gap-4">
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {sortForAttention(report.figures).map((f, i) => <RecapHealthFigure key={f.key} figure={f} index={i} />)}
            </ul>
            {report.unsorted > 0 && <p className="text-body-sm">{t("unsorted", { count: report.unsorted })}</p>}
          </div>
          <RecapHealthTips month={month} report={report} />
        </div>
      )}
    </section>
  )
}
