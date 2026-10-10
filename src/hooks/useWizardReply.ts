import { useTranslations } from "use-intl"
import { usePeople } from "@/hooks/usePeople"
import { useWizardStore } from "@/stores/wizard-store"
import type { WIZARD_QUESTIONS } from "@/constants/wizard"

type Question = (typeof WIZARD_QUESTIONS)[number]

// My answer to a question, as words — shared by the mobile thread and the desktop ticket
export const useWizardReply = () => {
  const t = useTranslations("wizard")
  const answers = useWizardStore((s) => s.answers)
  const { data: people = [] } = usePeople()
  return (q: Question): string => {
    if (q === "location") return t(`location.${answers.location ?? "home"}`)
    if (q === "temp") return t(`temp.${answers.temp ?? "any"}`)
    if (q === "leftovers") return t(answers.leftovers ? "leftovers.yes" : "leftovers.no")
    const names = people.filter((p) => answers.diners.includes(p.id)).map((p) => p.name)
    return [names.join(", "), answers.guests ? t("diners.plusGuests", { count: answers.guests }) : ""].filter(Boolean).join(" ")
  }
}
