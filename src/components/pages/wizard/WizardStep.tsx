import { useRef } from "react"
import { WizardChoice } from "@/components/pages/wizard/WizardChoice"
import { WizardDiners } from "@/components/pages/wizard/WizardDiners"
import { WizardFridge } from "@/components/pages/wizard/WizardFridge"
import { WizardResults } from "@/components/pages/wizard/WizardResults"
import { useRiseIn } from "@/hooks/useRiseIn"
import { useWizardStore } from "@/stores/wizard-store"

// The current question (or the results). Each one rises in as it arrives.
export const WizardStep = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const step = useWizardStore((s) => s.step)
  const answers = useWizardStore((s) => s.answers)
  const answer = useWizardStore((s) => s.answer)
  useRiseIn(rootRef, step)

  return (
    <div ref={rootRef} aria-live="polite">
      <div key={step} data-anim="step" className="invisible">
        {step === "location" && (
          <WizardChoice step="location" value={answers.location}
            onPick={(location) => answer({ location, ...(location === "travel" && { leftovers: false }) }, "temp")} />
        )}
        {step === "temp" && (
          <WizardChoice step="temp" value={answers.temp}
            onPick={(temp) => answer({ temp }, "leftovers")} />
        )}
        {step === "leftovers" && (
          <WizardChoice step="leftovers"
            value={answers.leftovers === null ? null : answers.leftovers ? "yes" : "no"}
            onPick={(v) => answer({ leftovers: v === "yes" }, "fridge")} />
        )}
        {step === "fridge" && <WizardFridge />}
        {step === "diners" && <WizardDiners />}
        {step === "results" && <WizardResults />}
      </div>
    </div>
  )
}
