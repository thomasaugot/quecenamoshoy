import { useId, useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconEdit, IconPlus } from "@/components/ui/Icons"
import { DISH_NOTES_MAX } from "@/constants/dish"
import { useSetDishNotes } from "@/hooks/useDishes"
import type { Dish } from "@/types/dish"

// "Mis notas": my standing note on the dish — not tied to one dinner like "La última vez…".
// A slip of paper pinned above the recipe; tap to write on it, in place.
export const DishMyNotes = ({ dish }: { dish: Dish }) => {
  const t = useTranslations("dish.myNotes")
  const fieldId = useId()
  const save = useSetDishNotes()
  const [draft, setDraft] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft === null) return
    save.mutate({ dishId: dish.id, notes: draft }, { onSuccess: () => setDraft(null) })
  }

  return (
    <aside aria-labelledby="dish-my-notes" className="-rotate-1 flex flex-col gap-3 rounded-sm bg-paper p-5 shadow-md lg:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="dish-my-notes" className="text-voice-lg">{t("title")}</h2>
        {draft === null && dish.notes && (
          <Button variant="link" onClick={() => setDraft(dish.notes ?? "")} icon={<IconEdit className="h-4 w-4 shrink-0" />}>
            {t("edit")}
          </Button>
        )}
      </div>

      {draft !== null ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="field-line flex flex-col gap-0.5">
            <label htmlFor={fieldId} className="text-label">{t("label")}</label>
            <textarea id={fieldId} name="dish-notes" rows={4} maxLength={DISH_NOTES_MAX} value={draft} autoFocus
              placeholder={t("placeholder")} onChange={(e) => setDraft(e.target.value)}
              className="keyboard-focus-ring text-voice w-full resize-y bg-transparent py-2 placeholder:text-text-muted" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={save.isPending}>{t("save")}</Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>{t("cancel")}</Button>
          </div>
        </form>
      ) : dish.notes ? (
        <p className="text-voice whitespace-pre-line text-text">{dish.notes}</p>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-note text-text-soft">{t("empty")}</p>
          <Button variant="outlined" size="sm" onClick={() => setDraft("")} icon={<IconPlus className="h-4 w-4 shrink-0" />}>
            {t("add")}
          </Button>
        </div>
      )}
    </aside>
  )
}
