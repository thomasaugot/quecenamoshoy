import { useRef } from "react"
import { PageMeta } from "@/components/layout/PageMeta"
import { HomeEntries } from "@/components/pages/home/HomeEntries"
import { HomeForgotten } from "@/components/pages/home/HomeForgotten"
import { HomeGreeting } from "@/components/pages/home/HomeGreeting"
import { HomeLog } from "@/components/pages/home/HomeLog"
import { HomeRate } from "@/components/pages/home/HomeRate"
import { HomeRecent } from "@/components/pages/home/HomeRecent"
import { HomeWeek } from "@/components/pages/home/HomeWeek"
import { useEntrance } from "@/hooks/useEntrance"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Mobile first, in reading order: greeting, the two ways in at the thumb, what we ate lately,
// what we haven't had for a while, this week's goals, and "already ate? log it".
// lg: the design's desktop frame — words and actions on the left (with the week's note),
// a photo wall on the right. Grid placement, so the DOM keeps the mobile order.
export const HomePage = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)

  return (
    <>
      <PageMeta page="home" />
      <div
        ref={rootRef}
        className="mx-auto flex w-full max-w-md flex-col gap-10 px-6 pt-6 pb-10 lg:grid lg:max-w-310 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_auto_auto_1fr] lg:items-start lg:gap-x-14 lg:gap-y-8 lg:px-8 lg:pt-11 lg:pb-16"
      >
        <div className="lg:col-start-1 lg:row-start-1"><HomeGreeting /></div>
        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2"><HomeEntries /><HomeRate /></div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1"><HomeRecent /></div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-3"><HomeForgotten /></div>
        <div className="lg:col-start-1 lg:row-start-4"><HomeWeek /></div>
        <div className="lg:col-start-1 lg:row-start-3"><HomeLog /></div>
      </div>
    </>
  )
}
