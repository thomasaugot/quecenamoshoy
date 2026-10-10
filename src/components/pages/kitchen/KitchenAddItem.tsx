import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { EQUIPMENT } from "@/constants/equipment"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useAddKitchenItems } from "@/hooks/useKitchen"
import { useKitchenStore } from "@/stores/kitchen-store"
import type { EquipmentCategory } from "@/types/kitchen"
import { customKey, matchCatalogue, personNameError } from "@/utils/people"

// Anything the list doesn't have: type it. A name that IS on the list switches that chip on.
export const KitchenAddItem = ({ category }: { category: EquipmentCategory }) => {
  const t = useTranslations("kitchen.checklist")
  const label = useCatalogueLabel()
  const location = useKitchenStore((s) => s.location)
  const add = useAddKitchenItems()
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = personNameError(text)
    if (problem) return setError(t(problem))
    const known = matchCatalogue(text, EQUIPMENT[category].map((key) => ({ key, label: label("equipment", key) })))
    add.mutate(
      [known
        ? { key: known, category, label: null, location, source: "mine" }
        : { key: customKey(text), category, label: text.trim(), location, source: "mine" }],
      { onSuccess: () => setText("") },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex items-end gap-2 md:max-w-sm">
      <div className="grow">
        <Input label={t("addLabel")} name={`add-${category}`} autoComplete="off" placeholder={t(`${category}Placeholder`)}
          value={text} onChange={(event) => { setText(event.target.value); setError(null) }} error={error ?? undefined} />
      </div>
      <Button type="submit" variant="outlined" size="icon" aria-label={t("add")} loading={add.isPending}
        icon={<IconPlus className="h-5 w-5 shrink-0" />} className="mb-0.5" />
    </form>
  )
}
