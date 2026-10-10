import { describe, expect, it } from "vitest"
import { ingredientsFromText, parseIngredients, parseSteps, stepsFromText, toDraft } from "@/utils/recipes"

describe("recipe JSON from the database", () => {
  it("keeps only well-formed entries", () => {
    expect(parseIngredients([{ item: "harina", quantity: "200 g" }, { nope: 1 }, "x", { item: " " }])).toEqual([{ item: "harina", quantity: "200 g" }])
    expect(parseSteps(["Mezclar", 3, "", "Hornear"])).toEqual(["Mezclar", "Hornear"])
    expect(parseIngredients(null)).toEqual([])
  })
})

describe("editing a recipe as text", () => {
  it("round-trips ingredients and steps", () => {
    const draft = toDraft({ servings: 2, prepMinutes: 20, goodForLeftovers: false, equipment: [], source: "ai", sourceUrl: null,
      ingredients: [{ quantity: "200 g", item: "harina" }, { quantity: "", item: "sal" }], steps: ["Mezclar", "Hornear"] })
    expect(ingredientsFromText(draft.ingredientsText)).toEqual([{ quantity: "200 g", item: "harina" }, { quantity: "", item: "sal" }])
    expect(stepsFromText(draft.stepsText)).toEqual(["Mezclar", "Hornear"])
  })
  it("drops numbering I typed on steps", () => {
    expect(stepsFromText("1. Cortar\n2) Freír\n\n")).toEqual(["Cortar", "Freír"])
  })
})
