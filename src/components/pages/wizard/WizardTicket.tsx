import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { WIZARD_QUESTIONS } from "@/constants/wizard"
import { useWizardReply } from "@/hooks/useWizardReply"
import { useWizardStore } from "@/stores/wizard-store"
import { answeredQuestions } from "@/utils/suggestions"

// Desktop: tonight's order slip, pinned beside the questions. Each answer is written in by
// hand as it is given; a written line can be tapped to change it.
export const WizardTicket = () => {
  const t = useTranslations("wizard")
  const { step, goTo } = useWizardStore()
  const reply = useWizardReply()
  const done = answeredQuestions(WIZARD_QUESTIONS, step)

  return (
    <aside aria-labelledby="wizard-ticket" data-anim="pin" className="invisible hidden -rotate-2 flex-col gap-6 rounded-sm bg-paper p-8 shadow-xl lg:flex">
      <h2 id="wizard-ticket" className="text-voice-lg text-accent-strong">{t("ticket.title")}</h2>
      <ol className="flex flex-col gap-5">
        {WIZARD_QUESTIONS.map((q, i) => {
          const answered = done.includes(q)
          return (
            <li key={q} className="flex items-baseline gap-4">
              <span className="text-note w-6 shrink-0 text-text-muted">{i + 1}.</span>
              <div className="flex min-w-0 grow flex-col">
                <span className="text-label">{t(`${q}.short`)}</span>
                {answered ? (
                  <Button variant="ghost" onClick={() => goTo(q)} aria-label={t("change", { answer: reply(q) })}
                    contentClassName="text-voice-lg text-left"
                    className="-ml-2 min-h-11 justify-start rounded-md px-2 text-text hover:bg-surface-2">
                    {reply(q)}
                  </Button>
                ) : (
                  <span className={`text-voice-lg min-h-11 ${step === q ? "text-primary" : "text-border"}`}>
                    {step === q ? t("ticket.now") : t("ticket.pending")}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
