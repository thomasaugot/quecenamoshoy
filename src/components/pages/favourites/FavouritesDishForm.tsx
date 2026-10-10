import { useId, useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Chip } from "@/components/ui/Chip"
import { IconTrash } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { DISH_DESCRIPTION_MAX, DISH_NAME_MAX, PROTEINS, TEMPS, TRAITS } from "@/constants/dish"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useCreateDish, useDeleteDish, useUpdateDish } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import type { DishInput } from "@/types/dish"
import { dishNameError } from "@/utils/dishes"
import { toggleId } from "@/utils/people"

export const FavouritesDishForm = ({ dishId, initial, onDone }: {
  dishId: string | null
  initial: DishInput
  onDone: () => void
}) => {
  const t = useTranslations("favourites.editor")
  const label = useCatalogueLabel()
  const descriptionId = useId()
  const { data: people = [] } = usePeople()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const create = useCreateDish()
  const update = useUpdateDish()
  const remove = useDeleteDish()
  const set = (patch: Partial<DishInput>) => setForm((f) => ({ ...f, ...patch }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = dishNameError(form.name, DISH_NAME_MAX)
    if (problem) return setError(t(problem))
    const input = { ...form, name: form.name.trim(), description: form.description?.trim() || null }
    if (dishId) update.mutate({ id: dishId, input }, { onSuccess: onDone })
    else create.mutate(input, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <Input
        label={t("name")}
        name="dish-name"
        autoComplete="off"
        required
        maxLength={DISH_NAME_MAX}
        value={form.name}
        onChange={(event) => { set({ name: event.target.value }); setError(null) }}
        error={error ?? undefined}
      />

      <div className="field-line flex flex-col gap-0.5">
        <label htmlFor={descriptionId} className="text-label">{t("description")}</label>
        <textarea
          id={descriptionId}
          name="dish-description"
          rows={2}
          maxLength={DISH_DESCRIPTION_MAX}
          value={form.description ?? ""}
          onChange={(event) => set({ description: event.target.value })}
          className="keyboard-focus-ring text-body w-full resize-none bg-transparent py-2"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-label mb-3">{t("protein")}</legend>
        <div className="flex flex-wrap gap-2">
          {PROTEINS.map((p) => (
            <Chip key={p} tone="diet" pressed={form.protein === p}
              onClick={() => set({ protein: form.protein === p ? null : p })}>{label("protein", p)}</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-label mb-3">{t("traits")}</legend>
        <div className="flex flex-wrap gap-2">
          {TRAITS.map((trait) => (
            <Chip key={trait} tone="soft" pressed={form.traits.includes(trait)}
              onClick={() => set({ traits: toggleId(form.traits, trait) })}>{label("trait", trait)}</Chip>
          ))}
          {TEMPS.map((temp) => (
            <Chip key={temp} tone="soft" pressed={form.temp === temp}
              onClick={() => set({ temp: form.temp === temp ? null : temp })}>{label("temp", temp)}</Chip>
          ))}
        </div>
      </fieldset>

      {people.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-label mb-2">{t("lovedBy")}</legend>
          {people.map((p) => (
            <Checkbox key={p.id} name={`loved-${p.id}`} checked={form.lovedBy.includes(p.id)}
              onChange={() => set({ lovedBy: toggleId(form.lovedBy, p.id) })}>{p.name}</Checkbox>
          ))}
        </fieldset>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="submit" loading={create.isPending || update.isPending}>{t("save")}</Button>
          <Button variant="ghost" onClick={onDone}>{t("cancel")}</Button>
        </div>
        {dishId && (confirming ? (
          <Button size="sm" loading={remove.isPending} onClick={() => remove.mutate(dishId, { onSuccess: onDone })}
            className="bg-accent-strong hover:bg-accent-strong">{t("confirmDelete")}</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}
            icon={<IconTrash className="h-4 w-4 shrink-0" />} className="text-text-muted">{t("delete")}</Button>
        ))}
      </div>
    </form>
  )
}
