import { PageMeta } from "@/components/layout/PageMeta"
import { HistoryBody } from "@/components/pages/history/HistoryBody"
import { PageLoading } from "@/components/ui/PageLoading"
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
      {meals.isPending || people.isPending ? <PageLoading /> : <HistoryBody />}
    </>
  )
}
