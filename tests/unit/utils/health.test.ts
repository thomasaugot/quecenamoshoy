import { describe, expect, it } from "vitest"
import type { RecapMeal } from "@/types/meal"
import { healthReport, weeksBetween } from "@/utils/health"

const meal = (dishId: string, patch: Partial<RecapMeal> = {}): RecapMeal => ({
  dishId, dishName: dishId, imageUrl: null, eatenOn: "2026-10-01", rating: null, protein: null,
  proteins: [], traits: [], eatenOut: null, isNew: false, ...patch,
})
const figure = (r: ReturnType<typeof healthReport>, key: string) => r.figures.find((f) => f.key === key)

describe("weeksBetween", () => {
  it("counts a past month whole, the current one up to today", () => {
    expect(weeksBetween("2026-09-01", "2026-09-30", "2026-10-22")).toBeCloseTo(30 / 7)
    expect(weeksBetween("2026-10-01", "2026-10-31", "2026-10-14")).toBe(2)
    expect(weeksBetween("2026-10-01", "2026-10-31", "2026-10-02")).toBe(1)
  })
})

describe("healthReport", () => {
  const meals = [
    meal("steak", { proteins: ["red_meat"] }), meal("steak", { proteins: ["red_meat"] }),
    meal("chuletas", { proteins: ["pork"] }), meal("paella", { proteins: ["poultry", "seafood"] }),
    meal("lentejas", { proteins: ["vegetarian"], traits: ["legumes"] }),
    meal("frites", { traits: ["fried"] }),
    meal("", { dishId: null, eatenOut: "restaurant" }),
  ]
  const r = healthReport(meals, 1)
  it("counts per week, pork as red meat, a mixed dish in every group it belongs to", () => {
    expect(figure(r, "redMeat")).toMatchObject({ value: 3, ok: true })
    expect(figure(r, "fish")).toMatchObject({ value: 1, ok: false })
    expect(figure(r, "legumes")).toMatchObject({ value: 1, ok: false })
    expect(figure(r, "veggie")?.value).toBe(1)
    expect(figure(r, "fried")).toMatchObject({ value: 1, ok: true })
    expect(figure(r, "out")).toMatchObject({ value: 1, ok: true })
  })
  it("variety is distinct dishes over home dinners; dinners out stay out of it", () => {
    expect(figure(r, "variety")?.value).toBe(0.8)
    expect(r.dinners).toBe(7)
  })
  it("reports dinners it cannot read", () => {
    expect(healthReport([meal("x"), meal("y", { traits: ["soup"] })], 1).unsorted).toBe(1)
  })
})
