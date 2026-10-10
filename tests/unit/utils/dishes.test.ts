import { describe, expect, it } from "vitest"
import type { Dish } from "@/types/dish"
import { dishNameError, filterDishes, sortByLove } from "@/utils/dishes"

const dish = (name: string, lovedBy: string[] = [], description: string | null = null): Dish => ({
  id: name, name, description, protein: null, traits: [], temp: null, imageUrl: null, lovedBy, equipment: [],
})
const names = (d: Dish[]) => d.map((x) => x.name)

describe("filterDishes", () => {
  const all = [dish("Quiche lorraine", ["tom"]), dish("Paëlla", ["tom", "alex"]), dish("Sopa", [], "con fideos")]
  it("searches name and description, ignoring accents and case", () => {
    expect(names(filterDishes(all, { query: "PAELLA", personId: null }))).toEqual(["Paëlla"])
    expect(names(filterDishes(all, { query: "fideos", personId: null }))).toEqual(["Sopa"])
  })
  it("filters by who loves it", () => {
    expect(names(filterDishes(all, { query: "", personId: "alex" }))).toEqual(["Paëlla"])
  })
})

describe("sortByLove", () => {
  it("puts dishes loved by more people first, then by name", () => {
    expect(names(sortByLove([dish("B", ["a"]), dish("A", ["a"]), dish("C", ["a", "b"])]))).toEqual(["C", "A", "B"])
  })
})

describe("dishNameError", () => {
  it("mirrors the DB check", () => {
    expect(dishNameError("  ", 120)).toBe("required")
    expect(dishNameError("x".repeat(121), 120)).toBe("tooLong")
    expect(dishNameError("Tortilla", 120)).toBeNull()
  })
})
