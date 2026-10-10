import { useLocale, useTranslations } from "use-intl"
import { IconBasket } from "@/components/ui/Icons"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { useShopping } from "@/hooks/useShopping"
import { localizedPath } from "@/i18n/paths"
import { itemsLeft } from "@/utils/shopping"

// The shopping list, one tap away from every page, with what's left to buy
export const ShoppingBasket = () => {
  const t = useTranslations("nav")
  const locale = useLocale()
  const { data: items = [] } = useShopping()
  const left = itemsLeft(items)
  return (
    <TransitionLink href={localizedPath("shopping", locale)} aria-label={t("shoppingCount", { count: left })}
      className="keyboard-focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text">
      <IconBasket className="h-5 w-5 shrink-0" />
      {left > 0 && (
        <span aria-hidden="true" className="text-body-sm absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1 text-on-accent">
          {left}
        </span>
      )}
    </TransitionLink>
  )
}
