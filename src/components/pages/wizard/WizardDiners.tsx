import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { Stepper } from "@/components/ui/Stepper"
import { ALLERGENS } from "@/constants/allergens"
import { DIETS } from "@/constants/diets"
import { GUESTS_MAX } from "@/constants/meal"
import { WIZARD_QUESTIONS } from "@/constants/wizard"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useNow } from "@/hooks/useNow"
import { useOnline } from "@/hooks/useOnline"
import { usePeople } from "@/hooks/usePeople"
import { useSuggest } from "@/hooks/useSuggest"
import { useWizardStore } from "@/stores/wizard-store"
import type { WizardAnswers } from "@/types/suggestion"
import { isoDaysAgo } from "@/utils/dates"
import { toggleId } from "@/utils/people"
import { writeToday } from "@/utils/today"

// Who eats tonight: people at the table, guests, and anything a guest can't eat (tonight only).
export const WizardDiners = () => {
  const t = useTranslations("wizard.diners")
  const tw = useTranslations("wizard")
  const label = useCatalogueLabel()
  const locale = useLocale()
  const now = useNow()
  const { data: people = [] } = usePeople()
  const { answers, answer, shown } = useWizardStore()
  const suggest = useSuggest()
  const online = useOnline()
  const set = (patch: Partial<WizardAnswers>) => answer(patch, "diners")
  const nobody = answers.diners.length === 0 && answers.guests === 0

  const go = () => {
    writeToday({ date: isoDaysAgo(0, now), location: answers.location ?? "home", diners: answers.diners, guests: answers.guests })
    answer({}, "results")
    suggest.mutate({ answers, exclude: shown, language: locale })
  }

  return (
    <section aria-labelledby="wizard-diners" className="flex flex-col gap-7">
      <div>
        <p className="text-label">{tw("counter", { current: WIZARD_QUESTIONS.length, total: WIZARD_QUESTIONS.length })}</p>
        <h2 id="wizard-diners" className="text-voice-lg mt-2 text-primary">{t("question")}</h2>
      </div>

      <div role="group" aria-label={t("people")} className="flex flex-wrap gap-2">
        {people.map((p) => (
          <Chip key={p.id} tone="diet" pressed={answers.diners.includes(p.id)}
            onClick={() => set({ diners: toggleId(answers.diners, p.id) })}>{p.name}</Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-label">{t("guests")}</span>
        <Stepper value={answers.guests} min={0} max={GUESTS_MAX} onChange={(guests) => set({ guests, ...(guests === 0 && { guestRestrictions: [] }) })}
          label={t("guests")} decreaseLabel={t("guestsLess")} increaseLabel={t("guestsMore")} />
      </div>

      {answers.guests > 0 && (
        <div role="group" aria-labelledby="wizard-guest-restrictions" className="flex flex-col gap-3">
          <p id="wizard-guest-restrictions" className="flex items-baseline gap-3">
            <span className="text-label">{t("guestRestrictions")}</span>
            <span className="text-note text-accent-strong">{t("tonightOnly")}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <Chip key={a.key} tone="hard" pressed={answers.guestRestrictions.includes(a.key)}
                onClick={() => set({ guestRestrictions: toggleId(answers.guestRestrictions, a.key) })}>{label("allergy", a.key)}</Chip>
            ))}
            {DIETS.map((d) => (
              <Chip key={d} tone="diet" pressed={answers.guestRestrictions.includes(d)}
                onClick={() => set({ guestRestrictions: toggleId(answers.guestRestrictions, d) })}>{label("diet", d)}</Chip>
            ))}
          </div>
        </div>
      )}

      <Button size="lg" disabled={nobody || !online} onClick={go} className="self-start">{t("go")}</Button>
      {nobody && <p className="text-body-sm">{t("nobody")}</p>}
      {!online && <p className="text-body-sm">{t("needsConnection")}</p>}
    </section>
  )
}
