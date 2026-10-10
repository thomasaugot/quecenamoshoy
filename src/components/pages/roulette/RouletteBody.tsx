import { useRef } from "react"
import { RouletteHero } from "@/components/pages/roulette/RouletteHero"
import { RoulettePreference } from "@/components/pages/roulette/RoulettePreference"
import { RouletteResult } from "@/components/pages/roulette/RouletteResult"
import { RouletteTonight } from "@/components/pages/roulette/RouletteTonight"
import { RouletteWheel } from "@/components/pages/roulette/RouletteWheel"
import { useEntrance } from "@/hooks/useEntrance"
import { useRouletteStart } from "@/hooks/useRouletteStart"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Mobile: what I feel like, then the wheel, then what it picked. lg: the wheel is the page —
// a big plate on the right — with tonight and the preference written beside it.
export const RouletteBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  useRouletteStart()
  return (
    <div ref={rootRef}
      className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pt-6 pb-10 md:max-w-2xl lg:grid lg:max-w-310 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16 lg:px-8 lg:pt-8 lg:pb-10">
      <div className="flex flex-col gap-8">
        <RouletteHero />
        <RouletteTonight />
        <RoulettePreference />
      </div>
      <div className="flex flex-col items-center gap-6 lg:sticky lg:top-24">
        <RouletteWheel />
        <RouletteResult />
      </div>
    </div>
  )
}
