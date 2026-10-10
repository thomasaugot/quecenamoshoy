import { useLocale } from "use-intl"
import { useCreateMeal } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { useSpin } from "@/hooks/useSpin"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { useRouletteStore } from "@/stores/roulette-store"
import { isoDaysAgo } from "@/utils/dates"

// What the wheel picked once it has stopped, and the two things to do with it: eat it (logged
// for tonight, then the history) or spin again with the same preference (brief §3.7).
export const useRouletteWinner = () => {
  const locale = useLocale()
  const now = useNow()
  const { navigateTo } = useTransition()
  const { slots, winner, spinning, location, diners, guests } = useRouletteStore()
  const again = useSpin()
  const create = useCreateMeal()
  const dish = winner !== null && !spinning ? slots[winner]?.dish : undefined

  const eat = () => {
    if (!dish) return
    create.mutate(
      { dishId: dish.id, newDishName: null, eatenOn: isoDaysAgo(0, now), diners, guests, location, rating: null, note: null, withLeftovers: false, eatenOut: null, place: null, dishLabel: null },
      { onSuccess: () => void navigateTo(localizedPath("history", locale)) },
    )
  }

  return { dish, eat, eating: create.isPending, again }
}
