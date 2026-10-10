import { describe, expect, it } from "vitest"
import { findAllergens } from "@/utils/allergens"

const a = (key: string, label: string | null = null) => ({ key, label })
const keys = (found: { key: string }[]) => found.map((f) => f.key)

describe("findAllergens — the safety net never trusts the AI alone", () => {
  it("matches a synonym, whatever the case and accents", () => {
    expect(keys(findAllergens(["200 g de PIÑONES tostados"], [a("nuts")]))).toEqual(["nuts"])
    expect(keys(findAllergens(["un chorrito de nata"], [a("lactose")]))).toEqual(["lactose"])
    expect(keys(findAllergens(["2 oeufs"], [a("eggs")]))).toEqual(["eggs"])
  })

  it("matches whole words only", () => {
    expect(findAllergens(["100 g de panceta"], [a("gluten")])).toEqual([])
    expect(keys(findAllergens(["pan rallado"], [a("gluten")]))).toEqual(["gluten"])
  })

  it("matches an allergen I typed by its own text", () => {
    expect(keys(findAllergens(["1 kiwi maduro"], [a("c_kiwi", "Kiwi")]))).toEqual(["c_kiwi"])
    expect(findAllergens(["manzana"], [a("c_kiwi", "Kiwi")])).toEqual([])
  })

  it("only reports the allergens it was asked about, ignores unknown keys", () => {
    expect(keys(findAllergens(["queso", "nueces"], [a("nuts")]))).toEqual(["nuts"])
    expect(findAllergens(["queso"], [])).toEqual([])
    expect(findAllergens(["queso"], [a("not_a_key")])).toEqual([])
  })
})
