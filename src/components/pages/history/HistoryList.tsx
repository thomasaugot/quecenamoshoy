import { useFormatter, useTranslations } from "use-intl"
import { HistoryMeal } from "@/components/pages/history/HistoryMeal"
import { Button } from "@/components/ui/Button"
import { useMealHistory } from "@/hooks/useMeals"
import { dateFromIso } from "@/utils/dates"
import { groupByMonth } from "@/utils/meals"

// Month by month, newest first. Only the list is animated: pages load later and a row
// mounted after the entrance would stay `invisible`.
export const HistoryList = () => {
  const t = useTranslations("history.list")
  const format = useFormatter()
  const history = useMealHistory()
  const meals = history.data?.pages.flat() ?? []

  return (
    <section aria-labelledby="history-list" data-anim="rise" className="invisible flex flex-col gap-10">
      <h2 id="history-list" className="sr-only">{t("title")}</h2>
      {meals.length === 0 && <p className="text-note text-text-muted">{t("empty")}</p>}
      {groupByMonth(meals).map(({ month, meals: inMonth }) => (
        <div key={month} className="flex flex-col gap-4">
          <h3 className="text-label">{format.dateTime(dateFromIso(`${month}-01`), { month: "long", year: "numeric" })}</h3>
          <ul className="flex flex-col gap-3">
            {inMonth.map((meal, i) => <li key={meal.id}><HistoryMeal meal={meal} index={i} /></li>)}
          </ul>
        </div>
      ))}
      {history.hasNextPage && (
        <Button variant="outlined" loading={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()} className="self-start">
          {t("more")}
        </Button>
      )}
    </section>
  )
}
