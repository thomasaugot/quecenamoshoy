import { useTranslations } from "use-intl"
import { Chip } from "@/components/ui/Chip"
import { KITCHEN_LOCATIONS } from "@/constants/equipment"
import { useKitchenStore } from "@/stores/kitchen-store"

export const KitchenHero = () => {
  const t = useTranslations("kitchen.hero")
  const { location, setLocation } = useKitchenStore()
  return (
    <header className="flex flex-col gap-5">
      <div data-anim="rise" className="invisible">
        <h1 className="text-title">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h1>
        <p className="text-voice mt-2">{t("note")}</p>
      </div>
      <div data-anim="rise" role="group" aria-label={t("which")} className="invisible flex gap-2">
        {KITCHEN_LOCATIONS.map((loc) => (
          <Chip key={loc} tone="diet" pressed={location === loc} onClick={() => setLocation(loc)}>{t(loc)}</Chip>
        ))}
      </div>
    </header>
  )
}
