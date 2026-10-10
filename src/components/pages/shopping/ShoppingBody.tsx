import { useRef } from "react"
import { ShoppingAdd } from "@/components/pages/shopping/ShoppingAdd"
import { ShoppingHero } from "@/components/pages/shopping/ShoppingHero"
import { ShoppingList } from "@/components/pages/shopping/ShoppingList"
import { useEntrance } from "@/hooks/useEntrance"
import { initPinDrop } from "@/utils/animations/pin-drop"

// A list on note paper, held in one hand in the shop: one column, big tick boxes. lg: the
// list on the left, adding things on the right.
export const ShoppingBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  return (
    <div ref={rootRef} className="mx-auto w-full max-w-md px-6 pt-6 pb-10 md:max-w-2xl lg:max-w-310 lg:px-8 lg:pt-11 lg:pb-16">
      <ShoppingHero />
      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
        <ShoppingList />
        <div className="lg:sticky lg:top-28"><ShoppingAdd /></div>
      </div>
    </div>
  )
}
