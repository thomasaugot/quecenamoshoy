import { useState } from "react"
import { useTranslations } from "use-intl"
import { Chip } from "@/components/ui/Chip"
import { Input } from "@/components/ui/Input"
import { useDishes } from "@/hooks/useDishes"
import { filterDishes, hasExactName, sortByLove } from "@/utils/dishes"

const SHOWN = 12

// Type to find the dish; the matches appear as chips. A name that isn't a dish yet becomes
// "Nuevo: …", created when the meal is saved.
export const HistoryDishPicker = ({ dishId, newDishName, currentName, onPick, error }: {
  dishId: string | null
  newDishName: string | null
  currentName: string | null
  onPick: (pick: { dishId: string | null; newDishName: string | null }) => void
  error?: string
}) => {
  const t = useTranslations("history.editor")
  const { data: dishes = [] } = useDishes()
  const [query, setQuery] = useState("")
  const matches = sortByLove(filterDishes(dishes, { query, personId: null })).slice(0, SHOWN)
  const typed = query.trim()
  const selected = dishes.find((d) => d.id === dishId)

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={t("dish")}
        name="dish-search"
        type="search"
        autoComplete="off"
        placeholder={selected?.name ?? currentName ?? newDishName ?? t("dishPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        error={error}
      />
      <div role="group" aria-label={t("dishMatches")} className="flex flex-wrap gap-2">
        {selected && !matches.includes(selected) && (
          <Chip tone="diet" pressed onClick={() => onPick({ dishId: null, newDishName: null })}>{selected.name}</Chip>
        )}
        {newDishName && (
          <Chip tone="diet" pressed onClick={() => onPick({ dishId: null, newDishName: null })}>{t("newDish", { name: newDishName })}</Chip>
        )}
        {matches.map((d) => (
          <Chip key={d.id} tone="diet" pressed={d.id === dishId}
            onClick={() => onPick(d.id === dishId ? { dishId: null, newDishName: null } : { dishId: d.id, newDishName: null })}>
            {d.name}
          </Chip>
        ))}
        {typed && !hasExactName(dishes, typed) && typed !== newDishName && (
          <Chip tone="soft" pressed={false} onClick={() => { onPick({ dishId: null, newDishName: typed }); setQuery("") }}>
            {t("newDish", { name: typed })}
          </Chip>
        )}
      </div>
    </div>
  )
}
