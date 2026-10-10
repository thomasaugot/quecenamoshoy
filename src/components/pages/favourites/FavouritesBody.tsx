import { lazy, Suspense, useRef } from "react"
import { FavouritesGrid } from "@/components/pages/favourites/FavouritesGrid"
import { FavouritesHero } from "@/components/pages/favourites/FavouritesHero"
import { FavouritesToolbar } from "@/components/pages/favourites/FavouritesToolbar"
import { useEntrance } from "@/hooks/useEntrance"
import { useFavouritesStore } from "@/stores/favourites-store"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Opened on demand: its own chunk (14-PERFORMANCE)
const FavouritesEditor = lazy(() =>
  import("@/components/pages/favourites/FavouritesEditor").then((m) => ({ default: m.FavouritesEditor })))
const FavouritesImport = lazy(() =>
  import("@/components/pages/favourites/FavouritesImport").then((m) => ({ default: m.FavouritesImport })))

export const FavouritesBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  const editing = useFavouritesStore((s) => s.editing)
  const importing = useFavouritesStore((s) => s.importing)
  return (
    <div ref={rootRef} className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pt-6 pb-10 md:max-w-3xl lg:max-w-310 lg:gap-10 lg:px-8 lg:pt-11 lg:pb-16">
      <FavouritesHero />
      <FavouritesToolbar />
      <FavouritesGrid />
      {editing && <Suspense fallback={null}><FavouritesEditor /></Suspense>}
      {importing && <Suspense fallback={null}><FavouritesImport /></Suspense>}
    </div>
  )
}
