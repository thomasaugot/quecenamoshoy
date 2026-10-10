import { useRef } from "react"
import { SettingsGeneral } from "@/components/pages/settings/SettingsGeneral"
import { SettingsHero } from "@/components/pages/settings/SettingsHero"
import { SettingsPeople } from "@/components/pages/settings/SettingsPeople"
import { useEntrance } from "@/hooks/useEntrance"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Mobile: one column, people first. lg: the people at the table take the wide column, the
// house rules sit beside them as a sand panel that stays in view.
export const SettingsBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  return (
    <div ref={rootRef} className="mx-auto w-full max-w-md px-6 pt-6 pb-10 lg:max-w-310 lg:px-8 lg:pt-11 lg:pb-16">
      <SettingsHero />
      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
        <SettingsPeople />
        <SettingsGeneral />
      </div>
    </div>
  )
}
