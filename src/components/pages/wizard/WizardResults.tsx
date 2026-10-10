import { useLocale, useTranslations } from "use-intl"
import { WizardSuggestion } from "@/components/pages/wizard/WizardSuggestion"
import { Button } from "@/components/ui/Button"
import { Cloche } from "@/components/ui/Cloche"
import { useSuggest } from "@/hooks/useSuggest"
import { useWizardStore } from "@/stores/wizard-store"

// Three ideas. While Gemini thinks, the cloche keeps lifting its lid.
export const WizardResults = () => {
  const t = useTranslations("wizard.results")
  const locale = useLocale()
  const { answers, suggestions, shown, status, goTo } = useWizardStore()
  const suggest = useSuggest()
  const again = () => suggest.mutate({ answers, exclude: shown, language: locale })

  if (status === "loading" || status === "idle") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <Cloche inLoader className="h-24" />
        <p className="text-voice text-primary">{t("thinking")}</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="wizard-results" className="flex flex-col gap-6">
      <h2 id="wizard-results" className="text-voice-lg text-primary">{t("title")}</h2>
      {suggestions.length === 0 ? (
        <p className="text-body">{status === "error" ? t("failed") : t("none")}</p>
      ) : (
        <ol className="flex flex-col gap-6">
          {suggestions.map((s, i) => <li key={s.name}><WizardSuggestion suggestion={s} index={i} /></li>)}
        </ol>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outlined" onClick={again}>{suggestions.length ? t("again") : t("retry")}</Button>
        <Button variant="ghost" onClick={() => goTo("location")}>{t("restart")}</Button>
      </div>
    </section>
  )
}
