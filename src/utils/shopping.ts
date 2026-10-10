import type { ShoppingItem, ShoppingLine } from "@/types/shopping"
import { normaliseText } from "@/utils/people"

// "250 g", "1/2", "1,5 kg", "2 cuillères" → { amount: 250, unit: "g" }. Anything else: no amount.
export const parseQuantity = (quantity: string): { amount: number; unit: string } | null => {
  const m = quantity.trim().match(/^(\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/)
  if (!m || !m[1]) return null
  const [num, den] = m[1].split("/")
  const amount = den ? Number(num) / Number(den) : Number(m[1].replace(",", "."))
  return Number.isFinite(amount) ? { amount, unit: normaliseText(m[2] ?? "") } : null
}

const formatAmount = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace(".", ","))

// Strips leading "de/d'/of" so "de farine" and "farine" are one ingredient
const itemKey = (item: string) => normaliseText(item).replace(/^(de |d'|del |de la |of )/, "")

// One line per ingredient: same item and same unit → amounts added up ("200 g" + "400 g" =
// "600 g"); amounts that can't be added are listed side by side ("1 sobre + 200 g").
// Unchecked first, then by name. A line is checked only when every row behind it is.
export const shoppingLines = (items: readonly ShoppingItem[]): ShoppingLine[] => {
  const groups = new Map<string, ShoppingItem[]>()
  for (const i of items) groups.set(itemKey(i.item), [...(groups.get(itemKey(i.item)) ?? []), i])
  return [...groups.entries()].map(([key, rows]) => {
    const sums = new Map<string, number>()
    const loose: string[] = []
    for (const r of rows) {
      const q = parseQuantity(r.quantity)
      if (q) sums.set(q.unit, (sums.get(q.unit) ?? 0) + q.amount)
      else if (r.quantity.trim()) loose.push(r.quantity.trim())
    }
    const quantity = [...[...sums.entries()].map(([unit, n]) => `${formatAmount(n)}${unit ? ` ${unit}` : ""}`), ...loose].join(" + ")
    return {
      key,
      item: rows[0]?.item ?? key,
      quantity,
      ids: rows.map((r) => r.id),
      dishNames: [...new Set(rows.flatMap((r) => (r.dishName ? [r.dishName] : [])))],
      checked: rows.every((r) => r.checked),
    }
  }).sort((a, b) => Number(a.checked) - Number(b.checked) || a.item.localeCompare(b.item))
}

export const itemsLeft = (items: readonly ShoppingItem[]) => shoppingLines(items).filter((l) => !l.checked).length
