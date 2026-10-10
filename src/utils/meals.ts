import type { Meal, MealMonth } from "@/types/meal"

// Newest month first; meals keep the order they came in (newest first)
export const groupByMonth = (meals: readonly Meal[]): MealMonth[] =>
  meals.reduce<MealMonth[]>((months, meal) => {
    const month = meal.eatenOn.slice(0, 7)
    const last = months.at(-1)
    if (last?.month === month) last.meals.push(meal)
    else months.push({ month, meals: [meal] })
    return months
  }, [])

// Portions cooked: everyone at the table plus guests, never fewer than one
export const portions = (diners: readonly string[], guests: number) => Math.max(1, diners.length + guests)
