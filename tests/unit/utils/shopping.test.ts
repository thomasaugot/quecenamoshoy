import { describe, expect, it } from "vitest"
import type { ShoppingItem } from "@/types/shopping"
import { itemsLeft, parseQuantity, shoppingLines } from "@/utils/shopping"

const row = (id: string, item: string, quantity: string, dishName: string | null = null, checked = false): ShoppingItem =>
  ({ id, item, quantity, dishId: null, dishName, checked })

describe("parseQuantity", () => {
  it("reads numbers, fractions and units", () => {
    expect(parseQuantity("250 g")).toEqual({ amount: 250, unit: "g" })
    expect(parseQuantity("1/2 pimiento")).toEqual({ amount: 0.5, unit: "pimiento" })
    expect(parseQuantity("1,5 kg")).toEqual({ amount: 1.5, unit: "kg" })
    expect(parseQuantity("un peu")).toBeNull()
  })
})

describe("shoppingLines — one line per ingredient", () => {
  it("adds up the same ingredient in the same unit, from several recipes", () => {
    const [line] = shoppingLines([row("1", "de pâtes", "200 g", "Carbonara"), row("2", "pâtes", "400 g", "Pesto")])
    expect(line).toMatchObject({ quantity: "600 g", ids: ["1", "2"], dishNames: ["Carbonara", "Pesto"] })
  })
  it("keeps amounts it can't add side by side", () => {
    const [line] = shoppingLines([row("1", "lait", "20 cl"), row("2", "lait", "un fond")])
    expect(line?.quantity).toBe("20 cl + un fond")
  })
  it("puts what's left to buy first, and counts it", () => {
    const items = [row("1", "ail", "1", null, true), row("2", "beurre", "50 g")]
    expect(shoppingLines(items).map((l) => l.item)).toEqual(["beurre", "ail"])
    expect(itemsLeft(items)).toBe(1)
  })
})
