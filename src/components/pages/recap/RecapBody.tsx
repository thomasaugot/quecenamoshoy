import { useRef } from "react"
import { RecapHero } from "@/components/pages/recap/RecapHero"
import { RecapNotes } from "@/components/pages/recap/RecapNotes"
import { RecapPodium } from "@/components/pages/recap/RecapPodium"
import { useEntrance } from "@/hooks/useEntrance"
import type { RecapMeal } from "@/types/meal"
import { initPinDrop } from "@/utils/animations/pin-drop"
import { monthRecap } from "@/utils/recap"

// The month on one page: how much we cooked as a big handwritten number, the three most
// eaten dishes pinned like a podium, and side notes — firsts, the best dinner, what was on
// the plate. lg: podium left, notes right.
export const RecapBody = ({ month, meals }: { month: string; meals: RecapMeal[] }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  const recap = monthRecap(meals)
  return (
    <div ref={rootRef} className="mx-auto w-full max-w-md px-6 pt-6 pb-10 md:max-w-3xl lg:max-w-310 lg:px-8 lg:pt-11 lg:pb-16">
      <RecapHero month={month} recap={recap} />
      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
        <RecapPodium recap={recap} />
        <RecapNotes recap={recap} />
      </div>
    </div>
  )
}
