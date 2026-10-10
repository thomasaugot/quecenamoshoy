import { lazy, Suspense, useRef } from "react"
import { HistoryHero } from "@/components/pages/history/HistoryHero"
import { HistoryList } from "@/components/pages/history/HistoryList"
import { HistoryWeek } from "@/components/pages/history/HistoryWeek"
import { useEntrance } from "@/hooks/useEntrance"
import { useHistoryStore } from "@/stores/history-store"
import { initPinDrop } from "@/utils/animations/pin-drop"

const HistoryEditor = lazy(() =>
  import("@/components/pages/history/HistoryEditor").then((m) => ({ default: m.HistoryEditor })))

// Mobile: the week's note, then the dinners. lg: the dinners take the wide column and this
// week's goals sit beside them as a pinned note.
export const HistoryBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  const editing = useHistoryStore((s) => s.editing)
  return (
    <div ref={rootRef} className="mx-auto w-full max-w-md px-6 pt-6 pb-10 md:max-w-3xl lg:max-w-310 lg:px-8 lg:pt-11 lg:pb-16">
      <HistoryHero />
      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
        <div className="lg:order-2"><HistoryWeek /></div>
        <HistoryList />
      </div>
      {editing && <Suspense fallback={null}><HistoryEditor /></Suspense>}
    </div>
  )
}
