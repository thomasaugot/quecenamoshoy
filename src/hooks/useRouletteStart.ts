import { useEffect, useRef } from "react"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"
import { useRouletteStore } from "@/stores/roulette-store"
import { isoDaysAgo } from "@/utils/dates"
import { existingDiners } from "@/utils/people"
import { readToday } from "@/utils/today"

// Where I am and who eats are remembered for the day (brief §3.2): if I already said it
// today, the roulette doesn't ask again. Once per visit.
export const useRouletteStart = () => {
  const now = useNow()
  const { data: people } = usePeople()
  const { data: settings } = useSettings()
  const init = useRouletteStore((s) => s.init)
  const started = useRef(false)
  const todayIso = isoDaysAgo(0, now)

  useEffect(() => {
    if (started.current || !people || !settings) return
    started.current = true
    const today = readToday(todayIso)
    const usual = existingDiners(settings.defaultDiners, people)
    const me = people.find((p) => p.isMe)
    init({
      location: today?.location ?? "home",
      diners: today ? existingDiners(today.diners, people) : usual.length ? usual : me ? [me.id] : [],
      guests: today?.guests ?? 0,
      editing: !today,
    })
  }, [people, settings, init, todayIso])
}
