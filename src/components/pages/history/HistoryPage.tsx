import { PageMeta } from "@/components/layout/PageMeta"
import { HistorySkeleton } from "@/components/pages/history/HistorySkeleton"
import { HistoryBody } from "@/components/pages/history/HistoryBody"
import { useMealHistory } from "@/hooks/useMeals"
import { usePeople } from "@/hooks/usePeople"

export const HistoryPage = () => {
  const meals = useMealHistory()
  const people = usePeople()
  if (meals.isError) throw meals.error
  if (people.isError) throw people.error
  return (
    <>
      <PageMeta page="history" />
      {meals.isPending || people.isPending ? <HistorySkeleton /> : <HistoryBody />}
    </>
  )
}
