import { useTranslations } from "use-intl"
import { HistoryMealForm } from "@/components/pages/history/HistoryMealForm"
import { Modal } from "@/components/ui/Modal"
import { useMealHistory } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"
import { useHistoryStore } from "@/stores/history-store"
import type { MealInput } from "@/types/meal"
import { isoDaysAgo } from "@/utils/dates"
import { existingDiners } from "@/utils/people"

// Log a dinner, or edit one. A new one starts tonight, at home, with the usual diners.
export const HistoryEditor = () => {
  const t = useTranslations("history.editor")
  const editing = useHistoryStore((s) => s.editing)
  const closeEditor = useHistoryStore((s) => s.closeEditor)
  const now = useNow()
  const { data: people = [] } = usePeople()
  const { data: settings } = useSettings()
  const history = useMealHistory()
  const meal = editing && editing !== "new" ? history.data?.pages.flat().find((m) => m.id === editing) : undefined
  const me = people.find((p) => p.isMe)
  const usual = existingDiners(settings?.defaultDiners ?? [], people)

  const initial: MealInput = meal
    ? { dishId: meal.dishId, newDishName: null, eatenOn: meal.eatenOn, diners: meal.diners, guests: meal.guests,
        location: meal.location, rating: meal.rating, note: meal.note, withLeftovers: meal.withLeftovers }
    : { dishId: null, newDishName: null, eatenOn: isoDaysAgo(0, now), diners: usual.length ? usual : me ? [me.id] : [],
        guests: 0, location: "home", rating: null, note: null, withLeftovers: false }

  return (
    <Modal isOpen={editing !== null} onClose={closeEditor} title={meal ? t("editTitle") : t("newTitle")}>
      <HistoryMealForm key={editing ?? "closed"} mealId={meal?.id ?? null} dishName={meal?.dishName ?? null}
        initial={initial} onDone={closeEditor} />
    </Modal>
  )
}
