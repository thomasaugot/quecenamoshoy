import { useTranslations } from "use-intl"
import { KitchenAddItem } from "@/components/pages/kitchen/KitchenAddItem"
import { Chip } from "@/components/ui/Chip"
import { EQUIPMENT } from "@/constants/equipment"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useAddKitchenItems, useKitchen, useRemoveKitchenItem } from "@/hooks/useKitchen"
import { useKitchenStore } from "@/stores/kitchen-store"
import type { EquipmentCategory } from "@/types/kitchen"
import { customItemsIn } from "@/utils/kitchen"

// One category as a cloud of chips: on = I have it. My own typed items sit at the end.
export const KitchenCategory = ({ category }: { category: EquipmentCategory }) => {
  const t = useTranslations("kitchen.checklist")
  const label = useCatalogueLabel()
  const location = useKitchenStore((s) => s.location)
  const { data: items = [] } = useKitchen(location)
  const add = useAddKitchenItems()
  const remove = useRemoveKitchenItem()
  const titleId = `kitchen-${category}`
  const has = (key: string) => items.some((i) => i.key === key)
  const toggle = (key: string, itemLabel: string | null) =>
    has(key)
      ? remove.mutate({ location, key })
      : add.mutate([{ key, category, label: itemLabel, location, source: "mine" }])

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <p id={titleId} className="text-label">{t(category)}</p>
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT[category].map((key) => (
          <Chip key={key} tone="diet" pressed={has(key)} onClick={() => toggle(key, null)}>{label("equipment", key)}</Chip>
        ))}
        {customItemsIn(items, category).map((item) => (
          <Chip key={item.key} tone="diet" pressed onClick={() => toggle(item.key, item.label)}>{item.label}</Chip>
        ))}
      </div>
      <KitchenAddItem category={category} />
    </div>
  )
}
