import { useTranslations } from "use-intl"
import type { RestrictionKind } from "@/types/database"

type CatalogueGroup = RestrictionKind | "goal" | "protein" | "trait" | "temp" | "equipment"

// Catalogue keys are runtime strings, so the typed t() cannot check them here; the
// catalogue test checks instead that every key has a label (tests/unit/constants/catalogue.test.ts).
export const useCatalogueLabel = () => {
  const t = useTranslations("catalogue")
  return (group: CatalogueGroup, key: string) => t(`${group}.${key}` as Parameters<typeof t>[0])
}
