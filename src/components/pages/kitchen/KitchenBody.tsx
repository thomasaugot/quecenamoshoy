import { useRef } from "react"
import { KitchenChecklist } from "@/components/pages/kitchen/KitchenChecklist"
import { KitchenHero } from "@/components/pages/kitchen/KitchenHero"
import { KitchenScan } from "@/components/pages/kitchen/KitchenScan"
import { useEntrance } from "@/hooks/useEntrance"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Mobile: the scan first (the fast way in), then the checklist. lg: the checklist takes the
// wide column and the scan stays beside it.
export const KitchenBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  return (
    <div ref={rootRef} className="mx-auto w-full max-w-md px-6 pt-6 pb-10 md:max-w-3xl lg:max-w-310 lg:px-8 lg:pt-11 lg:pb-16">
      <KitchenHero />
      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
        <div className="lg:order-2"><KitchenScan /></div>
        <KitchenChecklist />
      </div>
    </div>
  )
}
