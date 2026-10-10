import { useParams } from "react-router"
import { PageMeta } from "@/components/layout/PageMeta"
import { DishSkeleton } from "@/components/pages/dish/DishSkeleton"
import { DishBody } from "@/components/pages/dish/DishBody"
import { DishMissing } from "@/components/pages/dish/DishMissing"
import { useDishes } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import { useRecipe } from "@/hooks/useRecipe"
import { useSettings } from "@/hooks/useSettings"

export const DishPage = () => {
  const { dishId = "" } = useParams()
  const dishes = useDishes()
  const recipe = useRecipe(dishId)
  const people = usePeople()
  const settings = useSettings()
  for (const q of [dishes, recipe, people, settings]) if (q.isError) throw q.error
  const pending = dishes.isPending || recipe.isPending || people.isPending || settings.isPending
  const dish = dishes.data?.find((d) => d.id === dishId)
  return (
    <>
      <PageMeta page="dish" />
      {pending ? <DishSkeleton /> : dish ? <DishBody dish={dish} /> : <DishMissing />}
    </>
  )
}
