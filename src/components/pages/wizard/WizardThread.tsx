import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { WIZARD_QUESTIONS } from "@/constants/wizard"
import { useWizardReply } from "@/hooks/useWizardReply"
import { useWizardStore } from "@/stores/wizard-store"
import { answeredQuestions } from "@/utils/suggestions"

// Phones: what I've answered so far as a conversation — the question in the kitchen's hand,
// my reply in a mustard bubble. Tapping a reply goes back to change it. (lg: WizardTicket.)
export const WizardThread = () => {
  const t = useTranslations("wizard")
  const { step, goTo } = useWizardStore()
  const reply = useWizardReply()
  const done = answeredQuestions(WIZARD_QUESTIONS, step)
  if (done.length === 0) return null

  return (
    <ol aria-label={t("thread")} className="flex flex-col gap-4 lg:hidden">
      {done.map((q) => (
        <li key={q} className="flex flex-col gap-1.5">
          <p className="text-voice">{t(`${q}.question`)}</p>
          <Button variant="ghost" onClick={() => goTo(q)} aria-label={t("change", { answer: reply(q) })}
            className="bubble-reply self-end px-4 py-2 hover:bg-highlight">
            {reply(q)}
          </Button>
        </li>
      ))}
    </ol>
  )
}
