import { useId, useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { HistoryDayPicker } from "@/components/pages/history/HistoryDayPicker"
import { HistoryDishPicker } from "@/components/pages/history/HistoryDishPicker"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Chip } from "@/components/ui/Chip"
import { IconTrash } from "@/components/ui/Icons"
import { RatingInput } from "@/components/ui/RatingInput"
import { Stepper } from "@/components/ui/Stepper"
import { GUESTS_MAX, MEAL_NOTE_MAX } from "@/constants/meal"
import { useCreateMeal, useDeleteMeal, useUpdateMeal } from "@/hooks/useMeals"
import { usePeople } from "@/hooks/usePeople"
import type { MealInput } from "@/types/meal"
import { toggleId } from "@/utils/people"

const LOCATIONS = ["home", "travel"] as const

export const HistoryMealForm = ({ mealId, dishName, initial, onDone }: {
  mealId: string | null
  dishName: string | null
  initial: MealInput
  onDone: () => void
}) => {
  const t = useTranslations("history.editor")
  const noteId = useId()
  const { data: people = [] } = usePeople()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const create = useCreateMeal()
  const update = useUpdateMeal()
  const remove = useDeleteMeal()
  const set = (patch: Partial<MealInput>) => setForm((f) => ({ ...f, ...patch }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.dishId && !form.newDishName) return setError(t("dishRequired"))
    const input = { ...form, note: form.note?.trim() || null }
    if (mealId) update.mutate({ id: mealId, input }, { onSuccess: onDone })
    else create.mutate(input, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <HistoryDishPicker
        dishId={form.dishId}
        newDishName={form.newDishName}
        currentName={dishName}
        onPick={(pick) => { set(pick); setError(null) }}
        error={error ?? undefined}
      />

      <HistoryDayPicker value={form.eatenOn} onChange={(eatenOn) => set({ eatenOn })} />

      <fieldset className="flex flex-col gap-1">
        <legend className="text-label mb-2">{t("diners")}</legend>
        {people.map((p) => (
          <Checkbox key={p.id} name={`diner-${p.id}`} checked={form.diners.includes(p.id)}
            onChange={() => set({ diners: toggleId(form.diners, p.id) })}>{p.name}</Checkbox>
        ))}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-body-sm">{t("guests")}</span>
          <Stepper value={form.guests} min={0} max={GUESTS_MAX} onChange={(guests) => set({ guests })}
            label={t("guests")} decreaseLabel={t("guestsLess")} increaseLabel={t("guestsMore")} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-label mb-3">{t("where")}</legend>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((loc) => (
            <Chip key={loc} tone="diet" pressed={form.location === loc} onClick={() => set({ location: loc })}>{t(loc)}</Chip>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <p className="text-label">{t("rating")}</p>
        <RatingInput value={form.rating} onChange={(rating) => set({ rating })}
          label={t("rating")} starLabel={(stars) => t("stars", { count: stars })} />
      </div>

      <div className="field-line flex flex-col gap-0.5">
        <label htmlFor={noteId} className="text-label">{t("note")}</label>
        <textarea id={noteId} name="note" rows={2} maxLength={MEAL_NOTE_MAX} placeholder={t("notePlaceholder")}
          value={form.note ?? ""} onChange={(event) => set({ note: event.target.value })}
          className="keyboard-focus-ring text-body w-full resize-none bg-transparent py-2 placeholder:text-text-muted" />
      </div>

      <Checkbox name="leftovers" checked={form.withLeftovers} onChange={(withLeftovers) => set({ withLeftovers })}>
        {t("leftovers")}
      </Checkbox>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="submit" loading={create.isPending || update.isPending}>{mealId ? t("save") : t("log")}</Button>
          <Button variant="ghost" onClick={onDone}>{t("cancel")}</Button>
        </div>
        {mealId && (confirming ? (
          <Button size="sm" loading={remove.isPending} onClick={() => remove.mutate(mealId, { onSuccess: onDone })}
            className="bg-accent-strong hover:bg-accent-strong">{t("confirmDelete")}</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}
            icon={<IconTrash className="h-4 w-4 shrink-0" />} className="text-text-muted">{t("delete")}</Button>
        ))}
      </div>
    </form>
  )
}
