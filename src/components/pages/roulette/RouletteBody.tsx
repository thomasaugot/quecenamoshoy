import { useRef } from "react"
import { RouletteActions } from "@/components/pages/roulette/RouletteActions"
import { RouletteHero } from "@/components/pages/roulette/RouletteHero"
import { RoulettePreference } from "@/components/pages/roulette/RoulettePreference"
import { RouletteResult } from "@/components/pages/roulette/RouletteResult"
import { RouletteResultSheet } from "@/components/pages/roulette/RouletteResultSheet"
import { RouletteTonight } from "@/components/pages/roulette/RouletteTonight"
import { RouletteWheel } from "@/components/pages/roulette/RouletteWheel"
import { useEntrance } from "@/hooks/useEntrance"
import { useRouletteStart } from "@/hooks/useRouletteStart"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Phones: the wheel is the first thing on the page with its buttons right under it, so the spin is
// watched; when it stops, the page dims and what it picked rises in a sheet. What I feel like
// comes after, to steer the next spin. lg: tonight and the preference on the left, the wheel a big plate on
// the right with its result.
export const RouletteBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  useRouletteStart()

  return (
    <div ref={rootRef}
      className="mx-auto flex w-full max-w-md flex-col gap-7 px-6 pt-5 pb-10 md:max-w-2xl lg:min-h-below-nav lg:grid lg:max-w-310 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:content-center lg:items-center lg:gap-x-16 lg:gap-y-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 lg:gap-8">
        <RouletteHero />
        <RouletteTonight />
      </div>
      <div className="flex flex-col items-center gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-6">
        <RouletteWheel />
        <RouletteActions className="flex lg:hidden" />
        <RouletteResult />
      </div>
      <RoulettePreference />
      <RouletteResultSheet />
    </div>
  )
}
