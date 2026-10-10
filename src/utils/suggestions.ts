import type { Person } from "@/types/person"
import type { Suggestion, WizardAnswers, WizardStep } from "@/types/suggestion"
import { findAllergens } from "@/utils/allergens"

// The allergy safety net at suggestion time (brief §3.8): the AI is not trusted alone. Until a
// recipe exists, what can be checked is the name, description and tags. Returns the labels or
// keys of the allergens found, for the warning.
export const suggestionAllergens = (s: Suggestion, diners: readonly Person[], guestRestrictions: readonly string[]) => {
  const allergens = [
    ...diners.flatMap((p) => p.restrictions.filter((r) => r.kind === "allergy")),
    ...guestRestrictions.map((key) => ({ key, label: null })),
  ]
  return findAllergens([s.name, s.description, ...s.tags], allergens)
}

export const portionsFor = (answers: Pick<WizardAnswers, "diners" | "guests" | "leftovers">) =>
  Math.max(1, answers.diners.length + answers.guests) + (answers.leftovers ? Math.max(1, answers.diners.length) : 0)


// The questions already answered, in order, given the current step
export const answeredQuestions = <Q extends WizardStep>(questions: readonly Q[], step: WizardStep): Q[] =>
  step === "results" ? [...questions] : questions.slice(0, Math.max(0, questions.indexOf(step as Q)))
