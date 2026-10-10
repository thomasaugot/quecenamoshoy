import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { useAddShopping } from "@/hooks/useShopping"
import { personNameError } from "@/utils/people"

// Anything that isn't in a recipe: "papel higiénico", "2 L de leche"
export const ShoppingAdd = () => {
  const t = useTranslations("shopping.add")
  const add = useAddShopping()
  const [item, setItem] = useState("")
  const [quantity, setQuantity] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = personNameError(item)
    if (problem) return setError(t(problem))
    add.mutate([{ item: item.trim(), quantity: quantity.trim(), dishId: null }], {
      onSuccess: () => { setItem(""); setQuantity("") },
    })
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby="shopping-add" data-anim="rise"
      className="invisible flex flex-col gap-4 rounded-xl bg-surface-2 p-5 lg:p-7">
      <h2 id="shopping-add" className="text-subheading">{t("title")}</h2>
      <Input label={t("item")} name="shop-item" autoComplete="off" placeholder={t("itemPlaceholder")}
        value={item} onChange={(e) => { setItem(e.target.value); setError(null) }} error={error ?? undefined} />
      <Input label={t("quantity")} name="shop-quantity" autoComplete="off" placeholder={t("quantityPlaceholder")}
        value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <Button type="submit" loading={add.isPending} icon={<IconPlus className="h-5 w-5 shrink-0" />} className="self-start">{t("submit")}</Button>
    </form>
  )
}
