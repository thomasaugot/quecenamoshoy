import { describe, expect, it } from "vitest"
import type { Dish, DishFilter } from "@/types/dish"
import { addTag, customTag, removeTag, suggestTags, tagOptions } from "@/utils/dish-tags"
import { dishNameError, filterDishes, needsSorting, sortByLove } from "@/utils/dishes"

const dish = (name: string, lovedBy: string[] = [], description: string | null = null): Dish => ({
  id: name, name, description, proteins: [], tags: [], traits: [], temp: null, imageUrl: null, lovedBy, dislikedBy: [], equipment: [], notes: null,
})
const names = (d: Dish[]) => d.map((x) => x.name)
const none: DishFilter = { query: "", personId: null, proteins: [], traits: [], temps: [] }

describe("filterDishes", () => {
  const all = [dish("Quiche lorraine", ["tom"]), dish("Paëlla", ["tom", "alex"]), dish("Sopa", [], "con fideos")]
  it("searches name and description, ignoring accents and case", () => {
    expect(names(filterDishes(all, { ...none, query: "PAELLA" }))).toEqual(["Paëlla"])
    expect(names(filterDishes(all, { ...none, query: "fideos" }))).toEqual(["Sopa"])
  })
  it("filters by who loves it", () => {
    expect(names(filterDishes(all, { ...none, personId: "alex" }))).toEqual(["Paëlla"])
  })
  it("matches any choice within a group, every group across", () => {
    const tagged: Dish[] = [
      { ...dish("Merluza"), proteins: ["fish"], traits: ["light"], temp: "hot" },
      { ...dish("Ensalada"), proteins: ["vegan"], traits: ["light", "salad"], temp: "cold" },
      { ...dish("Lentejas"), proteins: ["vegetarian"], traits: ["legumes"], temp: "hot" },
      dish("Sin clasificar"),
    ]
    expect(names(filterDishes(tagged, { ...none, proteins: ["fish", "vegan"] }))).toEqual(["Merluza", "Ensalada"])
    expect(names(filterDishes(tagged, { ...none, traits: ["light"], temps: ["hot"] }))).toEqual(["Merluza"])
    expect(names(filterDishes(tagged, { ...none, temps: ["cold", "hot"] }))).toEqual(["Merluza", "Ensalada", "Lentejas"])
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

describe("dish tags", () => {
  const label = (_: string, key: string) => ({ poultry: "Pollo", pork: "Cerdo", oven: "Al horno" }[key] ?? key)
  const options = tagOptions(label, ["chorizo", "de la abuela"])
  const empty = { proteins: [], traits: [], tags: [] }
  it("suggests catalogue words and my own, accents ignored, starts-with first", () => {
    expect(suggestTags(options, empty, "pó", 6).map((o) => o.label)).toEqual(["Pollo"])
    expect(suggestTags(options, empty, "cho", 6).map((o) => o.key)).toEqual(["chorizo"])
  })
  it("keeps what I typed unless the field already offers it", () => {
    expect(customTag(options, "  garbanzos  ")).toBe("garbanzos")
    expect(customTag(options, "pollo")).toBeNull()
  })
  it("adds and removes by kind, never twice", () => {
    const pollo = { kind: "protein" as const, key: "poultry", label: "Pollo" }
    const once = addTag(empty, pollo)
    expect(addTag(once, pollo).proteins).toEqual(["poultry"])
    expect(removeTag(addTag(once, { kind: "custom", key: "picante", label: "picante" }), pollo)).toEqual({ proteins: [], traits: [], tags: ["picante"] })
  })
  it("asks the AI only when my words left proteins or styles empty", () => {
    expect(needsSorting({ proteins: [], traits: [], tags: ["chorizo"] })).toBe(true)
    expect(needsSorting({ proteins: ["pork"], traits: ["oven"], tags: ["chorizo"] })).toBe(false)
  })
})
