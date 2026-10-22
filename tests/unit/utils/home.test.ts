import { describe, expect, it } from "vitest"
import type { Dish } from "@/types/dish"
import { forgottenFavourites } from "@/utils/home"

const dish = (id: string, lovedBy = ["me"]): Dish => ({
  id, name: id, description: null, proteins: [], tags: [], traits: [], temp: null, imageUrl: null, lovedBy, dislikedBy: [], equipment: [], notes: null,
})

describe("forgottenFavourites", () => {
  const dishes = [dish("quiche"), dish("paella"), dish("unloved", []), dish("tortilla"), dish("pho")]
  const last = { quiche: "2026-10-09", paella: "2026-08-01" }

  it("keeps loved dishes not eaten since the cut-off (or never logged)", () => {
    const ids = forgottenFavourites(dishes, last, "2026-09-19", "2026-10-10", 10).map((d) => d.id).sort()
    expect(ids).toEqual(["paella", "pho", "tortilla"])
  })
  it("shows the same handful all day, and at most `count`", () => {
    const a = forgottenFavourites(dishes, last, "2026-09-19", "2026-10-10", 2)
    const b = forgottenFavourites(dishes, last, "2026-09-19", "2026-10-10", 2)
    expect(a).toHaveLength(2)
    expect(a.map((d) => d.id)).toEqual(b.map((d) => d.id))
  })
})
