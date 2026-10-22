import { describe, expect, it } from "vitest"
import { navCurrent } from "@/utils/nav"

describe("navCurrent", () => {
  it("marks the page's own tab, and the tab a sub-page is reached from", () => {
    expect(navCurrent("home", "home")).toBe("page")
    expect(navCurrent("home", "roulette")).toBe("true")
    expect(navCurrent("favourites", "dish")).toBe("true")
    expect(navCurrent("history", "roulette")).toBeUndefined()
    expect(navCurrent("home", "shopping")).toBeUndefined()
  })
})
