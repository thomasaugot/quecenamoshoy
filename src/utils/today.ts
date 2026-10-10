import type { TodayAnswers } from "@/types/suggestion"

const STORAGE_KEY = "today-answers"

export const readToday = (todayIso: string): TodayAnswers | null => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    const t = parsed as TodayAnswers | null
    return t && t.date === todayIso && Array.isArray(t.diners) ? t : null
  } catch {
    return null
  }
}

export const writeToday = (answers: TodayAnswers): void => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)) } catch { /* private mode: not remembered */ }
}
