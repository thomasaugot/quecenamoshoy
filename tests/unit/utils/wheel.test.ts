import { describe, expect, it } from "vitest"
import type { WheelSlot } from "@/types/roulette"
import { labelTransform, landingRotation, shortLabel, wheelSegments } from "@/utils/wheel"

const slot = (weight: number) => ({ weight, matches: false, dish: {} }) as WheelSlot

describe("wheel geometry", () => {
  it("gives every dish an equal slice, whatever its weight", () => {
    expect(wheelSegments([slot(1), slot(3), slot(1), slot(1)])).toEqual([
      { start: 0, end: 90 }, { start: 90, end: 180 }, { start: 180, end: 270 }, { start: 270, end: 360 },
    ])
  })
  it("lands the winner's slice under the top pointer, after full turns", () => {
    const segment = { start: 90, end: 180 }
    const rotation = landingRotation(0, segment, 5, 0.5)
    const stopsAt = (((135 + rotation) % 360) + 360) % 360   // slice middle after rotating
    expect(stopsAt).toBeCloseTo(0)
    expect(rotation).toBeGreaterThanOrEqual(5 * 360)
  })
  it("keeps spinning forward from where it stopped", () => {
    expect(landingRotation(2000, { start: 0, end: 60 }, 5, 0)).toBeGreaterThan(2000 + 5 * 360 - 360)
  })
  it("shortens long names", () => {
    expect(shortLabel("Espaguetis a la carbonara con guanciale", 18)).toBe("Espaguetis a la c…")
  })
})

describe("labelTransform", () => {
  it("never writes a name upside down", () => {
    expect(labelTransform(100, 100, 50, { start: 0, end: 90 })).toContain("rotate(-45.00)")
    expect(labelTransform(100, 100, 50, { start: 180, end: 270 })).toContain("rotate(315.00)")
  })
})
