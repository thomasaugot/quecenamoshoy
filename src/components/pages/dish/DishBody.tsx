import { useRef } from "react"
import { DishHero } from "@/components/pages/dish/DishHero"
import { DishRecipe } from "@/components/pages/dish/DishRecipe"
import { useEntrance } from "@/hooks/useEntrance"
import type { Dish } from "@/types/dish"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Mobile: the dish pinned at the top, the recipe below. lg: the dish card stays on the left
// while the recipe — the thing you read while cooking — takes the wide column.
export const DishBody = ({ dish }: { dish: Dish }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  return (
    <div ref={rootRef}
      className="mx-auto flex w-full max-w-md flex-col gap-10 px-6 pt-6 pb-10 md:max-w-2xl lg:grid lg:max-w-310 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16 lg:px-8 lg:pt-11 lg:pb-16">
      <div className="lg:sticky lg:top-24"><DishHero dish={dish} /></div>
      <DishRecipe dish={dish} />
    </div>
  )
}
