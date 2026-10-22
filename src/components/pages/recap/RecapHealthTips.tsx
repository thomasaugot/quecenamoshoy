import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconSparkle } from "@/components/ui/Icons"
import { useHealthTips } from "@/hooks/useHealthTips"
import type { HealthReport } from "@/types/health"

// The AI's read of the month: asked for with one tap (each answer costs a call), then kept.
export const RecapHealthTips = ({ month, report }: { month: string; report: HealthReport }) => {
  const t = useTranslations("recap.health.tips")
  const locale = useLocale()
  const { tips, ask } = useHealthTips(month)
  const request = () => ask.mutate({ report, language: locale })

  return (
    <section aria-labelledby="recap-tips" className="flex flex-col gap-5 rounded-xl bg-surface-2 p-5 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="recap-tips" className="text-subheading">{t("title")}</h3>
        <Button variant={tips ? "ghost" : "filled"} size="sm" loading={ask.isPending} onClick={request}
          icon={<IconSparkle className="h-5 w-5 shrink-0" />}>
          {ask.isPending ? t("writing") : tips ? t("again") : t("ask")}
        </Button>
      </div>
      {!tips && !ask.isPending && <p className="text-note text-text-soft">{t("pitch")}</p>}
      {tips && (
        <>
          {tips.summary && <p className="text-voice">{tips.summary}</p>}
          <ol className="flex flex-col gap-5">
            {tips.tips.map((tip, i) => (
              <li key={tip.title} className="flex gap-4">
                <span aria-hidden="true" className="text-voice-lg w-6 shrink-0 text-accent">{i + 1}</span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-button">{tip.title}</p>
                  <p className="text-body-sm">{tip.why}</p>
                  {tip.dishes.length > 0 && (
                    <p className="text-note text-primary">{t("try")} {tip.dishes.join(" · ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
