import { describe, expect, it } from "vitest"
import type { Dish } from "@/types/dish"
import type { Person } from "@/types/person"
import { buildWheel, eligibleDishes, pickWeighted, weighDish, wordMatches, type RouletteContext } from "@/utils/roulette"

const dish = (id: string, patch: Partial<Dish> = {}): Dish => ({
  id, name: id, description: null, protein: null, traits: [], temp: null, imageUrl: null, lovedBy: ["me"], equipment: [], notes: null, ...patch,
})
const me: Person = { id: "me", name: "Tom", isMe: true, restrictions: [], goals: [] }
const ctx = (patch: Partial<RouletteContext> = {}): RouletteContext => ({
  dishes: [], diners: [me], guestRestrictions: [], recentMeals: [], avoidSinceIso: "2026-10-03", todayIso: "2026-10-10",
  kitchen: null, preference: { chips: [], text: "" }, ...patch,
})
const ids = (d: { id: string }[]) => d.map((x) => x.id)

describe("eligibleDishes — the same hard rules as the suggestions", () => {
  it("drops what we ate in the avoid window", () => {
    const c = ctx({ dishes: [dish("quiche"), dish("paella")], recentMeals: [{ dishId: "quiche", eatenOn: "2026-10-09", protein: null, traits: [], diners: [] }] })
    expect(ids(eligibleDishes(c))).toEqual(["paella"])
  })
  it("drops allergens and diets of anyone at the table, guests included", () => {
    const alex: Person = { ...me, id: "alex", restrictions: [{ kind: "diet", key: "vegetarian", label: null }] }
    const c = ctx({ diners: [me, alex], guestRestrictions: ["nuts"],
      dishes: [dish("steak", { protein: "red_meat" }), dish("pesto", { description: "con piñones" }), dish("tortilla", { protein: "eggs" })] })
    expect(ids(eligibleDishes(c))).toEqual(["tortilla"])
  })
  it("drops dishes needing equipment I don't have, once the kitchen is filled in", () => {
    const dishes = [dish("lasagna", { equipment: ["oven"] }), dish("salad")]
    expect(ids(eligibleDishes(ctx({ dishes, kitchen: [{ key: "hob", category: "appliance", label: null }] })))).toEqual(["salad"])
    expect(ids(eligibleDishes(ctx({ dishes, kitchen: null })))).toEqual(["lasagna", "salad"])
  })
})

describe("weighDish — preferences are weights, never filters", () => {
  it("boosts what I feel like and shrinks what I don't", () => {
    const carbonara = dish("Carbonara", { traits: ["pasta"] })
    const pollo = dish("Pollo", { protein: "poultry" })
    const c = ctx({ preference: { chips: ["pasta", "no_meat"], text: "" } })
    expect(weighDish(carbonara, c).weight).toBeGreaterThan(weighDish(pollo, c).weight)
    expect(weighDish(pollo, c).weight).toBeGreaterThan(0)
  })
  it("matches free text in the name", () => {
    expect(weighDish(dish("Curry verde"), ctx({ preference: { chips: [], text: "algo de curry" } })).matches).toBe(true)
  })
})

describe("pickWeighted and buildWheel", () => {
  it("picks by weight", () => {
    const items = [{ weight: 1 }, { weight: 3 }]
    expect(pickWeighted(items, () => 0.1)).toBe(0)
    expect(pickWeighted(items, () => 0.5)).toBe(1)
  })
  it("never puts more than 8 dishes on the wheel, each once", () => {
    const dishes = Array.from({ length: 20 }, (_, i) => dish(`d${i}`))
    const wheel = buildWheel(ctx({ dishes }), () => 0.42)
    expect(wheel).toHaveLength(8)
    expect(new Set(wheel.map((s) => s.dish.id)).size).toBe(8)
  })
})

describe("the preference decides — tolerant matching", () => {
  it("forgives a typo and ignores filler words", () => {
    expect(wordMatches("pates", "spates")).toBe(true)
    expect(wordMatches("gratinees", "gratin")).toBe(true)
    expect(wordMatches("pan", "pates")).toBe(false)
    const c = ctx({ preference: { chips: [], text: "avec de spates" } })
    expect(weighDish(dish("Pâtes carbonara"), c).matches).toBe(true)
    expect(weighDish(dish("Endives au jambon"), c).matches).toBe(false)
  })
  it("réconfortant finds gratins and stews by name", () => {
    const c = ctx({ preference: { chips: ["comfort"], text: "" } })
    expect(weighDish(dish("Gratin dauphinois"), c).matches).toBe(true)
  })
  it("fills the wheel with matches, others only up to six", () => {
    const dishes = [
      ...["Pâtes pesto", "Lasagne", "Tagliatelles saumon"].map((n) => dish(n)),
      ...Array.from({ length: 10 }, (_, i) => dish(`Salade ${i}`)),
    ]
    const wheel = buildWheel(ctx({ dishes, preference: { chips: [], text: "des pâtes" } }), () => 0.3)
    expect(wheel).toHaveLength(6)
    expect(wheel.filter((s) => s.matches)).toHaveLength(3)
  })
})
