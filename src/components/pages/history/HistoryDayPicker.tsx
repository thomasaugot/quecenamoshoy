import { useFormatter, useTranslations } from "use-intl"
import { Chip } from "@/components/ui/Chip"
import { useNow } from "@/hooks/useNow"
import { dateFromIso, lastDaysIso } from "@/utils/dates"

const DAYS = 7

// The last week as chips: Hoy, Ayer, then weekday names. An older date being edited stays
// as its own chip at the front.
export const HistoryDayPicker = ({ value, onChange }: { value: string; onChange: (iso: string) => void }) => {
  const t = useTranslations("history.editor")
  const format = useFormatter()
  const now = useNow()
  const days = lastDaysIso(DAYS, now)
  const shown = days.includes(value) ? days : [value, ...days]
  const name = (iso: string) =>
    iso === days[0] ? t("today")
      : iso === days[1] ? t("yesterday")
        : format.dateTime(dateFromIso(iso), { weekday: "short", day: "numeric", ...(days.includes(iso) ? {} : { month: "short" }) })

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-label mb-3">{t("when")}</legend>
      <div className="flex flex-wrap gap-2">
        {shown.map((iso) => (
          <Chip key={iso} tone="diet" pressed={iso === value} onClick={() => onChange(iso)}>{name(iso)}</Chip>
        ))}
      </div>
    </fieldset>
  )
}
