import { describe, expect, it } from "vitest"
import type { Meal } from "@/types/meal"
import { groupByMonth, portions } from "@/utils/meals"

const meal = (id: string, eatenOn: string): Meal => ({
  id, eatenOn, dishId: "d", dishName: "x", imageUrl: null, rating: null, note: null,
  guests: 0, location: "home", withLeftovers: false, diners: [],
})

describe("groupByMonth", () => {
  it("groups consecutive meals by month", () => {
    const months = groupByMonth([meal("a", "2026-10-09"), meal("b", "2026-10-01"), meal("c", "2026-09-30")])
    expect(months.map((m) => [m.month, m.meals.map((x) => x.id)])).toEqual([["2026-10", ["a", "b"]], ["2026-09", ["c"]]])
  })
})

describe("portions", () => {
  it("is diners plus guests, at least one", () => {
    expect(portions(["a", "b"], 1)).toBe(3)
    expect(portions([], 0)).toBe(1)
  })
})
