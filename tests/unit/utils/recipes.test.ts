import { describe, expect, it } from "vitest"
import { formatCountdown, ingredientsFromText, parseIngredients, parseSteps, stepMinutes, stepsFromText, toDraft } from "@/utils/recipes"

describe("recipe JSON from the database", () => {
  it("keeps only well-formed entries", () => {
    expect(parseIngredients([{ item: "harina", quantity: "200 g" }, { nope: 1 }, "x", { item: " " }])).toEqual([{ item: "harina", quantity: "200 g" }])
    expect(parseSteps(["Mezclar", 3, "", "Hornear"])).toEqual(["Mezclar", "Hornear"])
    expect(parseIngredients(null)).toEqual([])
  })
})

describe("editing a recipe as text", () => {
  it("round-trips ingredients and steps", () => {
    const draft = toDraft({ servings: 2, prepMinutes: 20, goodForLeftovers: false, equipment: [], source: "ai", sourceUrl: null, language: "es",
      ingredients: [{ quantity: "200 g", item: "harina" }, { quantity: "", item: "sal" }], steps: ["Mezclar", "Hornear"] })
    expect(ingredientsFromText(draft.ingredientsText)).toEqual([{ quantity: "200 g", item: "harina" }, { quantity: "", item: "sal" }])
    expect(stepsFromText(draft.stepsText)).toEqual(["Mezclar", "Hornear"])
  })
  it("drops numbering I typed on steps", () => {
    expect(stepsFromText("1. Cortar\n2) Freír\n\n")).toEqual(["Cortar", "Freír"])
  })
})

describe("cooking timers", () => {
  it("finds the time written in a step", () => {
    expect(stepMinutes("Enfourner 25 min à 180 °C")).toBe(25)
    expect(stepMinutes("Cocer durante 10 minutos")).toBe(10)
    expect(stepMinutes("Bake for 1 h 15")).toBe(75)
    expect(stepMinutes("Laisser reposer 2 heures")).toBe(120)
    expect(stepMinutes("Salpimentar al gusto")).toBeNull()
    expect(stepMinutes("Cortar 4 tomates")).toBeNull()
  })
  it("shows a countdown as m:ss", () => {
    expect(formatCountdown(605)).toBe("10:05")
    expect(formatCountdown(0)).toBe("0:00")
  })
})
