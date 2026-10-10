import { useId } from "react"
import { useTranslations } from "use-intl"
import { RouletteActions } from "@/components/pages/roulette/RouletteActions"
import { Chip } from "@/components/ui/Chip"
import { Input } from "@/components/ui/Input"
import { PREFERENCE_CHIPS } from "@/constants/roulette"
import { useRouletteStore } from "@/stores/roulette-store"
import { toggleId } from "@/utils/people"

// "¿Alguna preferencia hoy?" (brief §3.7). Chips and free text are weights:
// what matches is likelier to land on the wheel and to win, the rest stays possible. Or skip: "Sorpréndeme".
export const RoulettePreference = () => {
  const t = useTranslations("roulette.preference")
  const textId = useId()
  const { preference, setPreference } = useRouletteStore()

  return (
    <section aria-labelledby="roulette-preference" data-anim="rise" className="invisible flex flex-col gap-5">
      <h2 id="roulette-preference" className="text-voice-lg text-primary">{t("question")}</h2>
      <div role="group" aria-label={t("chips")} className="flex flex-wrap gap-2">
        {PREFERENCE_CHIPS.map((chip) => (
          <Chip key={chip.key} tone={"avoid" in chip ? "hard" : "diet"} pressed={preference.chips.includes(chip.key)}
            onClick={() => setPreference({ chips: toggleId(preference.chips, chip.key) })}>{t(`chip.${chip.key}`)}</Chip>
        ))}
      </div>
      <Input id={textId} label={t("textLabel")} name="preference" autoComplete="off" placeholder={t("textPlaceholder")}
        value={preference.text} onChange={(event) => setPreference({ text: event.target.value })} />
      {/* desktop: the buttons stay with the preference; phones have them under the wheel */}
      <RouletteActions className="hidden lg:flex" />
    </section>
  )
}
