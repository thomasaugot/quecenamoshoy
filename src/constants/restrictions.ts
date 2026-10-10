import { ALLERGENS } from "@/constants/allergens"
import { DIETS } from "@/constants/diets"
import { DISLIKES } from "@/constants/dislikes"
import type { ChipTone } from "@/types/ui"
import type { RestrictionKind } from "@/types/database"

// Display order on a person's card: the hard rules first.
export const RESTRICTION_KINDS = ["allergy", "diet", "dislike"] as const satisfies readonly RestrictionKind[]

export const RESTRICTION_CATALOGUE: Record<RestrictionKind, readonly string[]> = {
  allergy: ALLERGENS.map((a) => a.key),
  diet: DIETS,
  dislike: DISLIKES,
}

export const RESTRICTION_TONE: Record<RestrictionKind, ChipTone> = {
  allergy: "hard",
  diet: "diet",
  dislike: "soft",
}
