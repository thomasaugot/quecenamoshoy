import { PageMeta } from "@/components/layout/PageMeta"
import { FavouritesSkeleton } from "@/components/pages/favourites/FavouritesSkeleton"
import { FavouritesBody } from "@/components/pages/favourites/FavouritesBody"
import { useDishes } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"

// Both queries start together; the body mounts once both are in, so its entrance finds its
// targets on the first run.
export const FavouritesPage = () => {
  const dishes = useDishes()
  const people = usePeople()
  if (dishes.isError) throw dishes.error
  if (people.isError) throw people.error
  return (
    <>
      <PageMeta page="favourites" />
      {dishes.isPending || people.isPending ? <FavouritesSkeleton /> : <FavouritesBody />}
    </>
  )
}
