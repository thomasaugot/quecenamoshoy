import { useFormatter, useLocale } from "use-intl"
import { Polaroid } from "@/components/ui/Polaroid"
import { localizedPath } from "@/i18n/paths"
import type { RecentMeal } from "@/types/meal"
import { dateFromIso } from "@/utils/dates"

export const MealPolaroid = ({ meal, index }: { meal: RecentMeal; index: number }) => {
  const format = useFormatter()
  const locale = useLocale()
  return (
    <Polaroid imageUrl={meal.imageUrl} title={meal.dishName} index={index} href={localizedPath("dish", locale, { dishId: meal.dishId })}
      caption={format.dateTime(dateFromIso(meal.eatenOn), { weekday: "short", day: "numeric" })} />
  )
}
