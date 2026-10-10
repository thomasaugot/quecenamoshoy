import { useState } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useAddKitchenItems } from "@/hooks/useKitchen"
import { useKitchenStore } from "@/stores/kitchen-store"
import type { ScanResult } from "@/types/kitchen"
import { toggleId } from "@/utils/people"
import { initiallyTicked } from "@/utils/kitchen"

// What the scan found that I don't have yet. Untick mistakes, then add the rest.
export const KitchenScanReview = ({ finds, onDone }: { finds: ScanResult[]; onDone: () => void }) => {
  const t = useTranslations("kitchen.scan")
  const label = useCatalogueLabel()
  const location = useKitchenStore((s) => s.location)
  const add = useAddKitchenItems()
  const [ticked, setTicked] = useState(() => initiallyTicked(finds))

  if (finds.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-note text-primary">{t("nothingNew")}</p>
        <Button variant="outlined" onClick={onDone}>{t("again")}</Button>
      </div>
    )
  }

  const confirm = () =>
    add.mutate(
      finds.filter((f) => ticked.includes(f.key))
        .map((f) => ({ key: f.key, category: f.category, label: null, location, source: "ai" as const })),
      { onSuccess: onDone },
    )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-note text-primary">{t("found", { count: finds.length })}</p>
      <fieldset className="flex flex-col gap-0.5">
        <legend className="sr-only">{t("review")}</legend>
        {finds.map((f) => (
          <Checkbox key={f.key} name={`scan-${f.key}`} checked={ticked.includes(f.key)}
            onChange={() => setTicked((keys) => toggleId(keys, f.key))}>{label("equipment", f.key)}</Checkbox>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button onClick={confirm} disabled={ticked.length === 0} loading={add.isPending}>{t("add", { count: ticked.length })}</Button>
        <Button variant="ghost" onClick={onDone}>{t("discard")}</Button>
      </div>
    </div>
  )
}
