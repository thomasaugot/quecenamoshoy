import { useFormatter, useLocale, useTranslations } from "use-intl"
import { Polaroid } from "@/components/ui/Polaroid"
import { localizedPath } from "@/i18n/paths"
import type { RecentMeal } from "@/types/meal"
import { dateFromIso } from "@/utils/dates"

export const MealPolaroid = ({ meal, index }: { meal: RecentMeal; index: number }) => {
  const format = useFormatter()
  const locale = useLocale()
  const t = useTranslations("history.meal")
  const title = meal.dishName || (meal.eatenOut ? t(`out.${meal.eatenOut}`) : "")
  return (
    <Polaroid imageUrl={meal.imageUrl} title={title} index={index} href={meal.dishId ? localizedPath("dish", locale, { dishId: meal.dishId }) : undefined}
      caption={[format.dateTime(dateFromIso(meal.eatenOn), { weekday: "short", day: "numeric" }), meal.place].filter(Boolean).join(" · ")} />
  )
}
