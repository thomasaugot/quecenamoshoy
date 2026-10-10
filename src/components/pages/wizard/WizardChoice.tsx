import { useTranslations } from "use-intl"
import { WizardOptionIcon } from "@/components/pages/wizard/WizardOptionIcon"
import { Button } from "@/components/ui/Button"
import { WIZARD_OPTIONS, WIZARD_QUESTIONS } from "@/constants/wizard"

type ChoiceStep = keyof typeof WIZARD_OPTIONS
type Option<S extends ChoiceStep> = (typeof WIZARD_OPTIONS)[S][number]

// Alternating tilts: answers laid on the table like cards, straightened when pressed
const TILTS = ["lg:-rotate-1", "lg:rotate-1", "lg:-rotate-2"] as const

// One question, a few big cards: a picture, the answer, and a handwritten aside.
export const WizardChoice = <S extends ChoiceStep>({ step, value, onPick }: {
  step: S
  value: Option<S> | null
  onPick: (value: Option<S>) => void
}) => {
  const t = useTranslations("wizard")
  const options = WIZARD_OPTIONS[step] as readonly Option<S>[]
  return (
    <section aria-labelledby={`wizard-${step}`} className="flex flex-col gap-6 lg:gap-8">
      <div>
        <p className="text-label">{t("counter", { current: WIZARD_QUESTIONS.indexOf(step) + 1, total: WIZARD_QUESTIONS.length })}</p>
        <h2 id={`wizard-${step}`} className="text-voice-lg mt-2 text-primary">{t(`${step}.question` as Parameters<typeof t>[0])}</h2>
      </div>
      <div className={`grid gap-3 lg:gap-6 ${options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {options.map((option, i) => (
          <Button
            key={option}
            variant="outlined"
            aria-pressed={value === option}
            onClick={() => onPick(option)}
            contentClassName="flex h-full w-full flex-col items-start justify-between gap-6 text-left"
            className={`group min-h-28 items-stretch! rounded-xl p-5 shadow-md transition-transform hover:-translate-y-1 hover:rotate-0 aria-pressed:rotate-0 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary lg:min-h-64 lg:p-7 ${TILTS[i % TILTS.length]}`}
          >
            <WizardOptionIcon option={option} />
            <span className="flex flex-col items-start gap-1">
              <span className="text-heading">{t(`${step}.${option}` as Parameters<typeof t>[0])}</span>
              <span className="text-note text-accent-strong group-aria-pressed:text-on-primary">{t(`${step}.${option}Note` as Parameters<typeof t>[0])}</span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  )
}
