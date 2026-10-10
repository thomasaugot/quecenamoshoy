import { useTranslations } from "use-intl"
import { KitchenCategory } from "@/components/pages/kitchen/KitchenCategory"
import { EQUIPMENT_CATEGORIES } from "@/constants/equipment"

// Everything I own, by category. Animated as one block: chips come and go with each tap.
export const KitchenChecklist = () => {
  const t = useTranslations("kitchen.checklist")
  return (
    <section aria-labelledby="kitchen-checklist" data-anim="rise" className="invisible flex flex-col gap-9">
      <div>
        <h2 id="kitchen-checklist" className="text-heading">{t("title")}</h2>
        <p className="text-body mt-1 max-w-[52ch] text-text-soft">{t("intro")}</p>
      </div>
      {EQUIPMENT_CATEGORIES.map((category) => <KitchenCategory key={category} category={category} />)}
    </section>
  )
}
