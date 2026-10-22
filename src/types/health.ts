export type HealthKey = "redMeat" | "fish" | "legumes" | "veggie" | "fried" | "out" | "variety"

// "max": at most target per week; "min": at least target per week; "share": a 0–1 share of dinners
export type HealthKind = "max" | "min" | "share"

export type HealthFigure = { key: HealthKey; kind: HealthKind; value: number; target: number; ok: boolean }

export type HealthReport = {
  dinners: number
  weeks: number           // the span the per-week figures are measured over
  unsorted: number        // dinners whose dish says nothing about what's in it
  figures: HealthFigure[]
}

// What the AI writes back: a short read of the month and three things to change
export type HealthTip = { title: string; why: string; dishes: string[] }
export type HealthTips = { summary: string; tips: HealthTip[] }
