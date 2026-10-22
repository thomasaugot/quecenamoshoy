import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useClearShopping, useShopping } from "@/hooks/useShopping"
import { itemsLeft } from "@/utils/shopping"

export const ShoppingHero = () => {
  const t = useTranslations("shopping.hero")
  const { data: items = [] } = useShopping()
  const clear = useClearShopping()
  const left = itemsLeft(items)
  const anyChecked = items.some((i) => i.checked)

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div data-anim="rise" className="invisible">
        <h1 className="text-title">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h1>
        <p className="text-voice mt-2">{t("left", { count: left })}</p>
      </div>
      {/* always mounted: the first item added after the entrance would otherwise bring the
          buttons in still invisible */}
      <div data-anim="rise" className="invisible flex flex-wrap gap-2">
        {anyChecked && <Button variant="outlined" onClick={() => clear.mutate("checked")}>{t("clearChecked")}</Button>}
        {items.length > 0 && <Button variant="ghost" onClick={() => clear.mutate("all")}>{t("clearAll")}</Button>}
      </div>
    </header>
  )
}
