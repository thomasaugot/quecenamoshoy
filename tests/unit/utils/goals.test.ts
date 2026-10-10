import { describe, expect, it } from "vitest"
import type { CountedMeal } from "@/types/meal"
import type { Person } from "@/types/person"
import { goalProgress } from "@/utils/goals"

const me: Person = { id: "me", name: "Tom", isMe: true, avatarUrl: null, restrictions: [], goals: [] }
const meal = (eatenOn: string, patch: Partial<CountedMeal> = {}): CountedMeal =>
  ({ dishId: "d", eatenOn, protein: null, traits: [], diners: [], ...patch })

describe("goalProgress", () => {
  it("counts red meat against a limit", () => {
    const person = { ...me, goals: [{ key: "limit_red_meat", perWeek: 2 }] }
    const meals = [meal("2026-10-05", { protein: "red_meat" }), meal("2026-10-06", { protein: "red_meat" }), meal("2026-10-07", { protein: "red_meat" })]
    expect(goalProgress(person, meals)).toEqual([{ key: "limit_red_meat", kind: "limit", count: 3, target: 2, met: false }])
  })

  it("counts a min goal by protein or trait", () => {
    const person = { ...me, goals: [{ key: "more_vegetables", perWeek: 2 }] }
    const meals = [meal("2026-10-05", { protein: "vegan" }), meal("2026-10-06", { traits: ["salad"] })]
    expect(goalProgress(person, meals)[0]).toMatchObject({ count: 2, met: true })
  })

  it("counts light dinners on weekdays only", () => {
    const person = { ...me, goals: [{ key: "light_weekdays", perWeek: 1 }] }
    // 2026-10-10 is a Saturday, 2026-10-09 a Friday
    expect(goalProgress(person, [meal("2026-10-10", { traits: ["light"] })])[0]?.count).toBe(0)
    expect(goalProgress(person, [meal("2026-10-09", { traits: ["light"] })])[0]?.count).toBe(1)
  })

  it("only counts dinners the person ate; nobody recorded = me", () => {
    const alex: Person = { ...me, id: "alex", isMe: false, goals: [{ key: "try_vegan", perWeek: 1 }] }
    const meals = [meal("2026-10-05", { protein: "vegan" }), meal("2026-10-06", { protein: "vegan", diners: ["me"] })]
    expect(goalProgress(alex, meals)[0]?.count).toBe(0)
    expect(goalProgress({ ...me, goals: alex.goals }, meals)[0]?.count).toBe(2)
  })
})
