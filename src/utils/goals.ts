import { GOALS } from "@/constants/goals"
import type { CountedMeal } from "@/types/meal"
import type { GoalCounts, GoalProgress, Person } from "@/types/person"
import { isWeekday } from "@/utils/dates"

export const countsToward = (meal: CountedMeal, counts: GoalCounts): boolean =>
  (!counts.weekdaysOnly || isWeekday(meal.eatenOn)) &&
  (!!(meal.protein && counts.proteins?.includes(meal.protein)) ||
    meal.traits.some((t) => counts.traits?.includes(t)))

// A meal logged with nobody at the table (older entries) counts for me.
const ateIt = (meal: CountedMeal, person: Person) =>
  meal.diners.length ? meal.diners.includes(person.id) : person.isMe

// This week, per goal of this person: how many dinners counted, against the target.
// limit: met while count ≤ target. min: met once count ≥ target.
export const goalProgress = (person: Person, meals: readonly CountedMeal[]): GoalProgress[] =>
  person.goals.flatMap((goal) => {
    const def = GOALS.find((g) => g.key === goal.key)
    if (!def) return []
    const count = meals.filter((m) => ateIt(m, person) && countsToward(m, def.counts)).length
    return [{ key: goal.key, kind: def.kind, count, target: goal.perWeek,
      met: def.kind === "limit" ? count <= goal.perWeek : count >= goal.perWeek }]
  })
