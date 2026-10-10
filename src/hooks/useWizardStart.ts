import { useEffect, useRef } from "react"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"
import { useWizardStore } from "@/stores/wizard-store"
import { isoDaysAgo } from "@/utils/dates"
import { existingDiners } from "@/utils/people"
import { readToday } from "@/utils/today"

// Each visit starts a fresh conversation, once — a later refetch of people or settings must
// not reset it mid-way. Who eats starts from what I said earlier today, else the usual
// diners from Settings, else me.
export const useWizardStart = () => {
  const now = useNow()
  const { data: people } = usePeople()
  const { data: settings } = useSettings()
  const start = useWizardStore((s) => s.start)
  const started = useRef(false)
  const todayIso = isoDaysAgo(0, now)

  useEffect(() => {
    if (started.current || !people || !settings) return
    started.current = true
    const today = readToday(todayIso)
    const usual = existingDiners(settings.defaultDiners, people)
    const me = people.find((p) => p.isMe)
    start({
      diners: today ? existingDiners(today.diners, people) : usual.length ? usual : me ? [me.id] : [],
      guests: today?.guests ?? 0,
    })
  }, [people, settings, start, todayIso])
}
