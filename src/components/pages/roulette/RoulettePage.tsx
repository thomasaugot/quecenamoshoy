import { PageMeta } from "@/components/layout/PageMeta"
import { RouletteBody } from "@/components/pages/roulette/RouletteBody"
import { PageLoading } from "@/components/ui/PageLoading"
import { useDishes } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"

export const RoulettePage = () => {
  const dishes = useDishes()
  const people = usePeople()
  const settings = useSettings()
  for (const q of [dishes, people, settings]) if (q.isError) throw q.error
  return (
    <>
      <PageMeta page="roulette" />
      {dishes.isPending || people.isPending || settings.isPending ? <PageLoading /> : <RouletteBody />}
    </>
  )
}
