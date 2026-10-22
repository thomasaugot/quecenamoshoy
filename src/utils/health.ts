import { FISH, HEALTH_TARGETS, PLANT_PROTEINS, RED_MEAT, VEGGIE_TRAITS } from "@/constants/health"
import type { HealthFigure, HealthKey, HealthReport } from "@/types/health"
import type { RecapMeal } from "@/types/meal"

const DAY_MS = 86_400_000
const round1 = (n: number) => Math.round(n * 10) / 10
const has = (xs: readonly string[], set: readonly string[]) => xs.some((x) => set.includes(x))

// Weeks covered by [fromIso, toIso], stopping at today for the month in progress (min 1)
export const weeksBetween = (fromIso: string, toIso: string, todayIso: string): number => {
  const end = toIso < todayIso ? toIso : todayIso
  const days = Math.round((Date.parse(end) - Date.parse(fromIso)) / DAY_MS) + 1
  return Math.max(1, days / 7)
}

// The month against general guidance: per-week counts of what was on the plate, and how
// varied it was. A dinner out counts as "out" and nothing else (we don't know what was in it).
export const healthReport = (meals: readonly RecapMeal[], weeks: number): HealthReport => {
  const home = meals.filter((m) => !m.eatenOut && m.dishId)
  const count = (match: (m: RecapMeal) => boolean) => home.filter(match).length
  const counts: Record<Exclude<HealthKey, "variety">, number> = {
    redMeat: count((m) => has(m.proteins, RED_MEAT)),
    fish: count((m) => has(m.proteins, FISH)),
    legumes: count((m) => m.traits.includes("legumes")),
    veggie: count((m) => has(m.proteins, PLANT_PROTEINS) || has(m.traits, VEGGIE_TRAITS)),
    fried: count((m) => m.traits.includes("fried")),
    out: meals.filter((m) => m.eatenOut).length,
  }
  const variety = home.length ? new Set(home.map((m) => m.dishId)).size / home.length : 1

  const figures: HealthFigure[] = HEALTH_TARGETS.map(({ key, kind, target }) => {
    const value = key === "variety" ? round1(variety) : round1(counts[key] / weeks)
    return { key, kind, target, value, ok: kind === "max" ? value <= target : value >= target }
  })
  return {
    dinners: meals.length,
    weeks: round1(weeks),
    unsorted: home.filter((m) => m.proteins.length === 0 && m.traits.length === 0).length,
    figures,
  }
}

// What needs work first, in the guide's order otherwise
export const sortForAttention = (figures: readonly HealthFigure[]): HealthFigure[] =>
  [...figures].sort((a, b) => Number(a.ok) - Number(b.ok))
