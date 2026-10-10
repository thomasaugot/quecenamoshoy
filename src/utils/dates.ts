const pad = (n: number) => String(n).padStart(2, "0")

// Local calendar date (YYYY-MM-DD) n days ago — meals.eaten_on is a plain date, not a timestamp.
export const isoDaysAgo = (days: number, from: Date = new Date()): string => {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// "2026-10-08" → a Date at local midnight (never `new Date(iso)`, which is UTC midnight).
export const dateFromIso = (iso: string): Date => {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Monday of the week `from` is in (the week a goal is counted over)
export const startOfWeekIso = (from: Date): string => {
  const d = new Date(from)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toIso(d)
}

export const isWeekday = (iso: string): boolean => {
  const day = dateFromIso(iso).getDay()
  return day >= 1 && day <= 5
}

// The last `count` days, today first, as YYYY-MM-DD
export const lastDaysIso = (count: number, from: Date): string[] =>
  Array.from({ length: count }, (_, i) => isoDaysAgo(i, from))
