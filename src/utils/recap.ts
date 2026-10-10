import type { MonthRecap, RecapDish, RecapMeal } from "@/types/meal"

const pad = (n: number) => String(n).padStart(2, "0")

// "2026-10" → first and last day of that month, YYYY-MM-DD
export const monthBounds = (month: string): { from: string; to: string } => {
  const [y = 1970, m = 1] = month.split("-").map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` }
}

export const shiftMonth = (month: string, by: number): string => {
  const [y = 1970, m = 1] = month.split("-").map(Number)
  const d = new Date(y, m - 1 + by, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const currentMonth = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}`

export const isMonth = (value: string | null): value is string => !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)

// The month in numbers: dinners, distinct dishes, firsts, the three most eaten (ties: best
// rated), the best-rated dinner (latest wins a tie), the protein mix, the average stars.
export const monthRecap = (meals: readonly RecapMeal[]): MonthRecap => {
  const byDish = new Map<string, RecapDish & { stars: number[] }>()
  for (const m of meals) {
    const d = byDish.get(m.dishId) ?? { dishId: m.dishId, name: m.dishName, imageUrl: m.imageUrl, count: 0, stars: [] }
    d.count++
    if (m.rating !== null) d.stars.push(m.rating)
    byDish.set(m.dishId, d)
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  const top = [...byDish.values()]
    .sort((a, b) => b.count - a.count || avg(b.stars) - avg(a.stars) || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(({ dishId, name, imageUrl, count }) => ({ dishId, name, imageUrl, count }))
  const rated = meals.filter((m) => m.rating !== null)
  const best = rated.reduce<RecapMeal | null>((b, m) => (!b || (m.rating ?? 0) >= (b.rating ?? 0) ? m : b), null)
  const proteins = new Map<string, number>()
  for (const m of meals) proteins.set(m.protein ?? "unknown", (proteins.get(m.protein ?? "unknown") ?? 0) + 1)
  return {
    dinners: meals.length,
    dishes: byDish.size,
    newDishes: meals.filter((m) => m.isNew).map((m) => m.dishName),
    top,
    best,
    proteins: [...proteins.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    averageRating: rated.length ? Math.round(avg(rated.map((m) => m.rating ?? 0)) * 10) / 10 : null,
  }
}
