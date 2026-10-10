import type { WheelSegment, WheelSlot } from "@/types/roulette"

// Equal slices: a wheel with uneven slices reads as broken. The weights still decide which
// dishes make the wheel and how likely each one is to win (utils/roulette.ts).
export const wheelSegments = (slots: readonly WheelSlot[]): WheelSegment[] => {
  const size = 360 / (slots.length || 1)
  return slots.map((_, i) => ({ start: i * size, end: (i + 1) * size }))
}

const point = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180   // 0° = top
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
}

// SVG path of a pie slice, 0° at the top, clockwise
export const arcPath = (cx: number, cy: number, r: number, { start, end }: WheelSegment): string => {
  if (end - start >= 359.999) return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
  const [x1, y1] = point(cx, cy, r, start)
  const [x2, y2] = point(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

// Label along the slice's middle radius. On the left half it is turned half a turn more, so
// no name is ever upside down.
export const labelTransform = (cx: number, cy: number, r: number, { start, end }: WheelSegment): string => {
  const mid = (start + end) / 2
  const [x, y] = point(cx, cy, r, mid)
  const angle = mid > 180 ? mid + 90 : mid - 90
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`
}

// Total rotation that lands the winner's slice under the pointer (top) after `turns` full
// turns from `current`. `jitter` in [0, 1) picks where in the slice it stops (never the edge).
export const landingRotation = (current: number, segment: WheelSegment, turns: number, jitter: number): number => {
  const width = segment.end - segment.start
  const target = segment.start + width * (0.2 + 0.6 * jitter)
  const base = Math.ceil(current / 360) * 360 + turns * 360
  return base + ((360 - target) % 360)
}

export const shortLabel = (name: string, max = 18) => (name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name)
