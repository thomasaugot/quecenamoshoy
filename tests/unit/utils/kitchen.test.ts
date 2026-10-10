import { describe, expect, it } from "vitest"
import type { KitchenItem, ScanResult } from "@/types/kitchen"
import { customItemsIn, initiallyTicked, itemsIn, newFinds } from "@/utils/kitchen"

const owned: KitchenItem[] = [
  { key: "oven", category: "appliance", label: null },
  { key: "c_sifon", category: "tool", label: "Sifón" },
]
const found: ScanResult[] = [
  { key: "oven", category: "appliance", confidence: 0.9 },
  { key: "wok", category: "cookware", confidence: 0.8 },
  { key: "zester", category: "tool", confidence: 0.3 },
]

describe("kitchen helpers", () => {
  it("groups by category and spots my own items", () => {
    expect(itemsIn(owned, "appliance").map((i) => i.key)).toEqual(["oven"])
    expect(customItemsIn(owned, "tool").map((i) => i.key)).toEqual(["c_sifon"])
  })
  it("keeps only new finds, confident ones ticked", () => {
    const finds = newFinds(found, owned)
    expect(finds.map((f) => f.key)).toEqual(["wok", "zester"])
    expect(initiallyTicked(finds)).toEqual(["wok"])
  })
})
