import { useFormatter, useTranslations } from "use-intl"
import { IconAlert, IconCheck } from "@/components/ui/Icons"
import type { HealthFigure } from "@/types/health"

// One figure as a note pinned on the board: the number big and handwritten, what it counts,
// the guide, and a verdict written out with its icon — never colour alone.
export const RecapHealthFigure = ({ figure, index }: { figure: HealthFigure; index: number }) => {
  const t = useTranslations("recap.health")
  const format = useFormatter()
  const share = figure.kind === "share"
  const value = share ? format.number(figure.value, { style: "percent" }) : format.number(figure.value, { maximumFractionDigits: 1 })
  const target = share ? format.number(figure.target, { style: "percent" }) : format.number(figure.target)
  const tilt = index % 3 === 0 ? "-rotate-1" : index % 3 === 1 ? "rotate-1" : ""

  return (
    <li className={`flex flex-col gap-2 rounded-sm p-4 shadow-md ${figure.ok ? "bg-paper" : "bg-highlight/40"} ${tilt}`}>
      <span className="text-label">{t(`figures.${figure.key}`)}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-voice-lg">{value}</span>
        {!share && <span className="text-body-sm">{t("perWeek")}</span>}
      </span>
      <span className="text-body-sm">{t(`guide.${figure.kind}`, { target })}</span>
      <span className={`text-button flex items-center gap-1.5 ${figure.ok ? "text-primary" : "text-accent-strong"}`}>
        {figure.ok ? <IconCheck className="h-4 w-4 shrink-0" /> : <IconAlert className="h-4 w-4 shrink-0" />}
        {figure.ok ? t("ok") : t("improve")}
      </span>
    </li>
  )
}
