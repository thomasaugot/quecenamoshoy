import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useSpin } from "@/hooks/useSpin"
import { useRouletteStore } from "@/stores/roulette-store"

// Spin with tonight's preference, or "Sorpréndeme" (no preference). On phones they sit right
// under the wheel; on desktop with the preference.
export const RouletteActions = ({ className = "" }: { className?: string }) => {
  const t = useTranslations("roulette.preference")
  const { preference, setPreference, spinning } = useRouletteStore()
  const spin = useSpin()
  const surprise = () => { setPreference({ chips: [], text: "" }); spin() }
  const any = preference.chips.length > 0 || preference.text.trim().length > 0
  return (
    <div className={`flex-wrap justify-center gap-2 lg:justify-start ${className}`}>
      <Button size="lg" onClick={spin} loading={spinning} disabled={!any}>{t("spin")}</Button>
      <Button size="lg" variant="outlined" onClick={surprise} disabled={spinning}>{t("surprise")}</Button>
    </div>
  )
}
