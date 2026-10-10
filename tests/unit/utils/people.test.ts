import { describe, expect, it } from "vitest"
import type { Person } from "@/types/person"
import { clamp, customKey, existingDiners, findGoal, initialOf, restrictionKeys, toggleId } from "@/utils/people"

const tom: Person = {
  id: "a", name: "tom", isMe: true, avatarUrl: null,
  restrictions: [{ kind: "allergy", key: "nuts", label: null }, { kind: "dislike", key: "olives", label: null }],
  goals: [{ key: "try_vegan", perWeek: 1 }],
}

describe("customKey", () => {
  it("fits the DB check and is stable", () => {
    expect(customKey("  Piñones tostados ")).toBe("c_pinones_tostados")
    expect(customKey("PIÑONES   tostados")).toBe("c_pinones_tostados")
    expect(customKey("!!!")).toBe("c_x")
    expect(customKey("a".repeat(80))).toMatch(/^[a-z0-9_]{1,40}$/)
  })
})

describe("people helpers", () => {
  it("splits restrictions by kind", () => {
    expect(restrictionKeys(tom, "allergy")).toEqual(["nuts"])
    expect(restrictionKeys(tom, "diet")).toEqual([])
  })
  it("finds a goal", () => {
    expect(findGoal(tom, "try_vegan")?.perWeek).toBe(1)
    expect(findGoal(tom, "more_fish")).toBeUndefined()
  })
  it("drops default diners who no longer exist", () => {
    expect(existingDiners(["a", "gone"], [tom])).toEqual(["a"])
  })
  it("toggles an id", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"])
    expect(toggleId(["a", "b"], "a")).toEqual(["b"])
  })
  it("initial and clamp", () => {
    expect(initialOf("  élodie")).toBe("É")
    expect(clamp(9, 0, 7)).toBe(7)
    expect(clamp(-1, 0, 7)).toBe(0)
  })
})
