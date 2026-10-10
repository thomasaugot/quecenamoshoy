import { useTranslations } from "use-intl"
import { Checkbox } from "@/components/ui/Checkbox"
import { useCheckShopping, useShopping } from "@/hooks/useShopping"
import { shoppingLines } from "@/utils/shopping"

// One line per ingredient (amounts from several recipes added up), still-to-buy first. A
// ticked line drops to the bottom, crossed out. Animated as one block: lines come and go.
export const ShoppingList = () => {
  const t = useTranslations("shopping.list")
  const { data: items = [] } = useShopping()
  const check = useCheckShopping()
  const lines = shoppingLines(items)

  return (
    <section aria-labelledby="shopping-list" data-anim="rise" className="invisible -rotate-[0.5deg] rounded-sm bg-paper p-5 shadow-lg lg:p-8">
      <h2 id="shopping-list" className="sr-only">{t("title")}</h2>
      {lines.length === 0 ? (
        <p className="text-note text-text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {lines.map((line) => (
            <li key={line.key} className={line.checked ? "opacity-50" : undefined}>
              <Checkbox name={`shop-${line.key}`} checked={line.checked}
                onChange={(checked) => check.mutate({ ids: line.ids, checked })}>
                <span className={`flex flex-wrap items-baseline gap-x-2 ${line.checked ? "line-through" : ""}`}>
                  {line.quantity && <span className="text-accent-strong">{line.quantity}</span>}
                  <span>{line.item}</span>
                  {line.dishNames.length > 0 && <span className="text-body-sm">· {line.dishNames.join(", ")}</span>}
                </span>
              </Checkbox>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
