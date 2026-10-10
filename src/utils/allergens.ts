import { ALLERGENS } from "@/constants/allergens"
import type { Restriction } from "@/types/person"
import { normaliseText } from "@/utils/people"

const SYNONYMS = new Map<string, string[]>(
  ALLERGENS.map((a) => [a.key, a.synonyms.map(normaliseText)]),
)

const containsWord = (haystack: string, word: string) =>
  new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u").test(haystack)

// A catalogue allergen matches any of its synonyms; one I typed matches its own text.
const wordsFor = (allergen: Pick<Restriction, "key" | "label">) =>
  allergen.label ? [normaliseText(allergen.label)] : SYNONYMS.get(allergen.key) ?? []

// The allergen safety net (brief §3.8): which of the diners' allergens appear in these
// ingredients. Whole words, accents and case ignored — "Piñones" matches nuts, "panceta" is not "pan".
export const findAllergens = <A extends Pick<Restriction, "key" | "label">>(
  ingredients: readonly string[],
  allergens: readonly A[],
): A[] => {
  const text = ingredients.map(normaliseText)
  return allergens.filter((a) => wordsFor(a).some((word) => text.some((line) => containsWord(line, word))))
}
