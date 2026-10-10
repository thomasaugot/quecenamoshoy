import { describe, expect, it } from "vitest"
import { PROTEINS, TEMPS, TRAITS } from "@/constants/dish"
import { GOALS } from "@/constants/goals"
import { RESTRICTION_CATALOGUE, RESTRICTION_KINDS } from "@/constants/restrictions"
import catalogue from "@/locales/es/common.json"

// useCatalogueLabel cannot be type-checked: this is its guard. Parity across languages is
// the locales test's job.
describe("every catalogue key has a label", () => {
  for (const kind of RESTRICTION_KINDS) {
    it(kind, () => {
      const labels: Record<string, string> = catalogue.catalogue[kind]
      for (const key of RESTRICTION_CATALOGUE[kind]) expect(labels[key], key).toBeTruthy()
    })
  }
  it("goal", () => {
    const labels: Record<string, string> = catalogue.catalogue.goal
    for (const goal of GOALS) expect(labels[goal.key], goal.key).toBeTruthy()
  })
  for (const [group, keys] of [["protein", PROTEINS], ["trait", TRAITS], ["temp", TEMPS]] as const) {
    it(group, () => {
      const labels: Record<string, string> = catalogue.catalogue[group]
      for (const key of keys) expect(labels[key], key).toBeTruthy()
    })
  }
})
