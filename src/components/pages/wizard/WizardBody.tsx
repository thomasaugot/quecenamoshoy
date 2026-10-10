import { useRef } from "react"
import { WizardHero } from "@/components/pages/wizard/WizardHero"
import { WizardStep } from "@/components/pages/wizard/WizardStep"
import { WizardThread } from "@/components/pages/wizard/WizardThread"
import { WizardTicket } from "@/components/pages/wizard/WizardTicket"
import { useEntrance } from "@/hooks/useEntrance"
import { useWizardStart } from "@/hooks/useWizardStart"
import { initPinDrop } from "@/utils/animations/pin-drop"

// A conversation, not a form (docs/design.html): the kitchen asks in handwriting, my answers
// stack up as mustard replies. lg: the conversation on the left, tonight's question or the
// three ideas filling the right.
export const WizardBody = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initPinDrop)
  useWizardStart()
  return (
    <div ref={rootRef}
      className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pt-6 pb-10 md:max-w-2xl lg:grid lg:max-w-310 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16 lg:px-8 lg:pt-11 lg:pb-16">
      <div className="flex flex-col gap-8 lg:sticky lg:top-28">
        <WizardHero />
        <WizardThread />
        <WizardTicket />
      </div>
      <WizardStep />
    </div>
  )
}
