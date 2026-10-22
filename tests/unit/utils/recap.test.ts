import { describe, expect, it } from "vitest"
import type { RecapMeal } from "@/types/meal"
import { isMonth, monthBounds, monthRecap, shiftMonth } from "@/utils/recap"

const meal = (dishId: string, eatenOn: string, patch: Partial<RecapMeal> = {}): RecapMeal => ({
  dishId, dishName: dishId, imageUrl: null, eatenOn, rating: null, protein: null, proteins: [], traits: [], eatenOut: null, isNew: false, ...patch,
})

describe("months", () => {
  it("knows each month's first and last day", () => {
    expect(monthBounds("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" })
    expect(monthBounds("2028-02").to).toBe("2028-02-29")
  })
  it("moves across years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
    expect(shiftMonth("2026-12", 1)).toBe("2027-01")
  })
  it("accepts only YYYY-MM", () => {
    expect(isMonth("2026-10")).toBe(true)
    expect(isMonth("2026-13")).toBe(false)
    expect(isMonth("oct")).toBe(false)
  })
})

describe("monthRecap", () => {
  const meals = [
    meal("quiche", "2026-10-02", { rating: 5, protein: "pork" }),
    meal("pasta", "2026-10-03", { rating: 3, isNew: true, protein: "vegetarian" }),
    meal("quiche", "2026-10-09", { rating: 4, protein: "pork" }),
    meal("salad", "2026-10-10", { protein: "vegan" }),
  ]
  const r = monthRecap(meals)
  it("counts dinners, dishes and firsts", () => {
    expect(r.dinners).toBe(4)
    expect(r.dishes).toBe(3)
    expect(r.newDishes).toEqual(["pasta"])
  })
  it("ranks the most eaten first", () => {
    expect(r.top.map((d) => [d.dishId, d.count])).toEqual([["quiche", 2], ["pasta", 1], ["salad", 1]])
  })
  it("finds the best-rated dinner and the average", () => {
    expect(r.best?.eatenOn).toBe("2026-10-02")
    expect(r.averageRating).toBe(4)
  })
  it("breaks down proteins, most first", () => {
    expect(r.proteins[0]).toEqual({ key: "pork", count: 2 })
  })
  it("is empty for an empty month", () => {
    expect(monthRecap([])).toMatchObject({ dinners: 0, best: null, averageRating: null, top: [] })
  })
})
