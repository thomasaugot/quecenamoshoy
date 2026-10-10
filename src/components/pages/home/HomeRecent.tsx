import { useTranslations } from "use-intl"
import { MealPolaroid } from "@/components/ui/MealPolaroid"
import { useRecentMeals } from "@/hooks/useHomeData"

// The last two weeks at a glance. Items arrive after the entrance, so only the section
// itself is animated — never async children (they would stay `invisible`).
export const HomeRecent = () => {
  const t = useTranslations("home.recent")
  const recent = useRecentMeals()

  return (
    <section aria-labelledby="home-recent-title" data-anim="rise" className="invisible flex flex-col gap-4">
      <h2 id="home-recent-title" className="text-label">{t("title")}</h2>
      {recent.isSuccess && recent.data.length === 0 && (
        <p className="text-note text-text-muted">{t("empty")}</p>
      )}
      {recent.isSuccess && recent.data.length > 0 && (
        <ul className="-mx-6 flex gap-5 overflow-x-auto px-6 pt-1 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0">
          {recent.data.map((meal, i) => (
            <li key={meal.id} className="flex min-w-0"><MealPolaroid meal={meal} index={i} /></li>
          ))}
        </ul>
      )}
      {recent.isError && <p className="text-body-sm">{t("empty")}</p>}
    </section>
  )
}
