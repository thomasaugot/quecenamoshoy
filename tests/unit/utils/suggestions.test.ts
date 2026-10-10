import { describe, expect, it } from "vitest"
import type { Person } from "@/types/person"
import type { Suggestion } from "@/types/suggestion"
import { answeredQuestions, portionsFor, suggestionAllergens } from "@/utils/suggestions"

const idea = (patch: Partial<Suggestion>): Suggestion => ({
  dishId: null, name: "Pasta", description: "", temp: "hot", prepMinutes: 20, goodForLeftovers: false,
  tags: [], equipment: [], isFavourite: false, reason: "", ...patch,
})
const alex: Person = { id: "a", name: "Alex", isMe: false, goals: [], restrictions: [{ kind: "allergy", key: "nuts", label: null }] }

describe("suggestionAllergens", () => {
  it("catches a diner's allergen in the name or description", () => {
    expect(suggestionAllergens(idea({ description: "con piñones tostados" }), [alex], []).map((a) => a.key)).toEqual(["nuts"])
  })
  it("includes tonight's guest allergens", () => {
    expect(suggestionAllergens(idea({ name: "Tortilla de huevos" }), [], ["eggs"]).map((a) => a.key)).toEqual(["eggs"])
  })
  it("is empty when nothing matches", () => {
    expect(suggestionAllergens(idea({ name: "Arroz blanco" }), [alex], [])).toEqual([])
  })
})

describe("wizard helpers", () => {
  it("counts portions: diners + guests, plus one per diner for leftovers", () => {
    expect(portionsFor({ diners: ["a", "b"], guests: 1, leftovers: false })).toBe(3)
    expect(portionsFor({ diners: ["a", "b"], guests: 0, leftovers: true })).toBe(4)
  })
})

describe("answeredQuestions", () => {
  const qs = ["location", "temp", "leftovers", "diners"] as const
  it("lists the questions before the current step", () => {
    expect(answeredQuestions(qs, "location")).toEqual([])
    expect(answeredQuestions(qs, "leftovers")).toEqual(["location", "temp"])
    expect(answeredQuestions(qs, "results")).toEqual([...qs])
  })
})
