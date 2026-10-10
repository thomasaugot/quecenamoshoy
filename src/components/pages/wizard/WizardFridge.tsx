import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { IconPlus } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { FRIDGE_ITEM_MAX, FRIDGE_MAX_ITEMS, WIZARD_QUESTIONS } from "@/constants/wizard"
import { useWizardStore } from "@/stores/wizard-store"
import { addIngredient } from "@/utils/suggestions"

// "Des choses à utiliser dans le frigo ?" — typed one by one, each a chip (tap to remove);
// the ideas then favour dishes that use them. Skippable: "Rien de spécial".
export const WizardFridge = () => {
  const t = useTranslations("wizard.fridge")
  const tw = useTranslations("wizard")
  const { answers, answer } = useWizardStore()
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const set = (ingredients: string[]) => answer({ ingredients }, "fridge")

  const add = (event: FormEvent) => {
    event.preventDefault()
    if (answers.ingredients.length >= FRIDGE_MAX_ITEMS) return setError(t("tooMany"))
    set(addIngredient(answers.ingredients, text))
    setText("")
  }

  return (
    <section aria-labelledby="wizard-fridge" className="flex flex-col gap-6">
      <div>
        <p className="text-label">{tw("counter", { current: WIZARD_QUESTIONS.indexOf("fridge") + 1, total: WIZARD_QUESTIONS.length })}</p>
        <h2 id="wizard-fridge" className="text-voice-lg mt-2 text-primary">{t("question")}</h2>
      </div>

      <form onSubmit={add} noValidate className="flex items-end gap-2">
        <div className="grow">
          <Input label={t("add")} name="fridge-item" autoComplete="off" maxLength={FRIDGE_ITEM_MAX} placeholder={t("placeholder")}
            value={text} onChange={(e) => { setText(e.target.value); setError(null) }} error={error ?? undefined} />
        </div>
        <Button type="submit" variant="outlined" size="icon" aria-label={t("addButton")} disabled={!text.trim()}
          icon={<IconPlus className="h-5 w-5 shrink-0" />} className="mb-0.5" />
      </form>

      {answers.ingredients.length > 0 && (
        <div role="group" aria-label={t("short")} className="flex flex-wrap gap-2">
          {answers.ingredients.map((item) => (
            <Chip key={item} tone="diet" pressed onClick={() => set(answers.ingredients.filter((i) => i !== item))}>
              <span aria-label={t("remove", { item })}>{item}</span>
            </Chip>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={() => answer({}, "diners")} disabled={answers.ingredients.length === 0}>{t("next")}</Button>
        <Button size="lg" variant="ghost" onClick={() => answer({ ingredients: [] }, "diners")}>{t("nothing")}</Button>
      </div>
    </section>
  )
}
