import { useId, useState, type FormEvent } from "react"
import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { IconTrash } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { PersonAvatar } from "@/components/ui/PersonAvatar"
import { TagField } from "@/components/ui/TagField"
import { DISH_DESCRIPTION_MAX, DISH_NAME_MAX, DISH_TAGS_MAX_COUNT, TEMPS } from "@/constants/dish"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { useCreateDish, useDeleteDish, useDishes, useEnrichDishes, useUpdateDish } from "@/hooks/useDishes"
import { usePeople } from "@/hooks/usePeople"
import type { DishInput } from "@/types/dish"
import { addTag, customTag, removeTag, selectedTags, suggestTags, tagOptions } from "@/utils/dish-tags"
import { dishNameError, needsSorting, setTaste } from "@/utils/dishes"

// How many matches the "what's in it" field offers at once
const TAG_SUGGESTIONS = 6

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
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const create = useCreateDish()
  const update = useUpdateDish()
  const remove = useDeleteDish()
  const set = (patch: Partial<DishInput>) => setForm((f) => ({ ...f, ...patch }))
  const { data: dishes = [] } = useDishes()
  const options = tagOptions(label, dishes.flatMap((d) => d.tags))
  const enrich = useEnrichDishes()
  // My own words leave proteins or styles empty: the AI fills them in, reading those words
  const sortIfNeeded = () => { if (needsSorting(form)) enrich.mutate(locale) }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = dishNameError(form.name, DISH_NAME_MAX)
    if (problem) return setError(t(problem))
    const input = { ...form, name: form.name.trim(), description: form.description?.trim() || null }
    if (dishId) update.mutate({ id: dishId, input }, { onSuccess: () => { sortIfNeeded(); onDone() } })
    else create.mutate(input, {
      onSuccess: (newId) => {
        sortIfNeeded()
        onDone()
        void navigateTo(localizedPath("dish", locale, { dishId: newId }))
      },
    })
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

      <TagField
        label={t("whatsIn")}
        hint={t("tagsHint")}
        placeholder={t("tagsPlaceholder")}
        selected={selectedTags(form, label)}
        suggest={(query) => suggestTags(options, form, query, TAG_SUGGESTIONS)}
        custom={(query) => customTag(options, query)}
        onAdd={(option) => setForm((f) => addTag(f, option))}
        onRemove={(option) => setForm((f) => removeTag(f, option))}
        addLabel={(text) => t("addTag", { tag: text })}
        removeLabel={(text) => t("removeTag", { tag: text })}
        kindLabel={(kind) => t(`tagKind.${kind}`)}
        full={form.tags.length >= DISH_TAGS_MAX_COUNT}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-label mb-3">{t("temp")}</legend>
        <div className="flex flex-wrap gap-2">
          {TEMPS.map((temp) => (
            <Chip key={temp} tone="soft" pressed={form.temp === temp}
              onClick={() => set({ temp: form.temp === temp ? null : temp })}>{label("temp", temp)}</Chip>
          ))}
        </div>
      </fieldset>

      {people.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-label mb-1">{t("tastes")}</legend>
          <p className="text-body-sm -mt-1">{t("tastesHint")}</p>
          <ul className="flex flex-col gap-3">
            {people.map((p) => (
              <li key={p.id} role="group" aria-label={p.name} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex min-w-28 items-center gap-2.5">
                  <PersonAvatar person={p} className="h-8 w-8" />
                  <span className="text-body">{p.name}</span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Chip tone="diet" pressed={form.lovedBy.includes(p.id)} onClick={() => setForm((f) => setTaste(f, p.id, "love"))}>{t("love")}</Chip>
                  <Chip tone="hard" pressed={form.dislikedBy.includes(p.id)} onClick={() => setForm((f) => setTaste(f, p.id, "dislike"))}>{t("dislike")}</Chip>
                </span>
              </li>
            ))}
          </ul>
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
