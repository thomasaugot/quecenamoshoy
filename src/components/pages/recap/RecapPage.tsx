import { useSearchParams } from "react-router"
import { PageMeta } from "@/components/layout/PageMeta"
import { RecapBody } from "@/components/pages/recap/RecapBody"
import { RecapSkeleton } from "@/components/pages/recap/RecapSkeleton"
import { useRecapMeals } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { currentMonth, isMonth, monthBounds } from "@/utils/recap"

// ?month=YYYY-MM picks the month (this month by default) — a link per month, back button works
export const RecapPage = () => {
  const now = useNow()
  const [params] = useSearchParams()
  const asked = params.get("month")
  const month = isMonth(asked) ? asked : currentMonth(now)
  const { from, to } = monthBounds(month)
  const recap = useRecapMeals(month, from, to)
  if (recap.isError) throw recap.error
  return (
    <>
      <PageMeta page="recap" />
      {recap.isPending ? <RecapSkeleton /> : <RecapBody key={month} month={month} meals={recap.data} />}
    </>
  )
}
