import { useCountedMeals } from "@/hooks/useMeals"
import { useDishes } from "@/hooks/useDishes"
import { useKitchen } from "@/hooks/useKitchen"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"
import { useRouletteStore } from "@/stores/roulette-store"
import { isoDaysAgo, startOfWeekIso } from "@/utils/dates"
import type { RouletteContext } from "@/utils/roulette"

// Everything the wheel's rules need, from the cached queries. Recent meals cover both this
// week (goals) and the avoid window, whichever reaches further back.
export const useRouletteContext = (): RouletteContext | null => {
  const now = useNow()
  const { location, diners: dinerIds, preference } = useRouletteStore()
  const { data: dishes } = useDishes()
  const { data: people } = usePeople()
  const { data: settings } = useSettings()
  const { data: kitchen } = useKitchen(location)
  const avoidSinceIso = isoDaysAgo(settings?.avoidDays ?? 7, now)
  const weekIso = startOfWeekIso(now)
  const { data: recentMeals } = useCountedMeals(avoidSinceIso < weekIso ? avoidSinceIso : weekIso)
  if (!dishes || !people || !settings || !recentMeals) return null
  return {
    dishes,
    diners: people.filter((p) => dinerIds.includes(p.id)),
    guestRestrictions: [],
    recentMeals,
    avoidSinceIso,
    todayIso: isoDaysAgo(0, now),
    // home with nothing ticked = not filled in yet (same rule as the suggest function)
    kitchen: location === "home" && !kitchen?.length ? null : kitchen ?? null,
    preference,
  }
}
