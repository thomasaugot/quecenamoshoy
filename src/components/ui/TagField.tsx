import { useId, useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/Button"
import { IconClose, IconPlus } from "@/components/ui/Icons"
import type { TagOption } from "@/types/dish"

// Pressed colour = what the app understands: green a protein (diets, goals), sage a style,
// paper my own word. The kind is also written for screen readers — never colour alone.
const TONE: Record<TagOption["kind"], string> = {
  protein: "border-primary! bg-primary! text-on-primary! hover:bg-primary-hover!",
  trait: "border-sage! bg-sage! text-on-primary!",
  custom: "border-text!",
}

// Type anything: matching words are offered as you type, and Enter keeps what you wrote.
// An ARIA combobox; the list sits in the flow (not floating) so a modal never clips it.
export const TagField = ({ label, hint, placeholder, selected, suggest, custom, onAdd, onRemove, addLabel, removeLabel, kindLabel, full }: {
  label: string
  hint: string
  placeholder: string
  selected: TagOption[]
  suggest: (query: string) => TagOption[]
  custom: (query: string) => string | null
  onAdd: (option: TagOption) => void
  onRemove: (option: TagOption) => void
  addLabel: (text: string) => string
  removeLabel: (text: string) => string
  kindLabel: (kind: TagOption["kind"]) => string
  full: boolean
}) => {
  const id = useId()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const suggestions = suggest(query)
  const own = custom(query)
  const rows: TagOption[] = [...suggestions, ...(own ? [{ kind: "custom" as const, key: own, label: own }] : [])]
  const open = rows.length > 0 && !full
  const current = Math.min(active, rows.length - 1)

  const pick = (option: TagOption) => {
    onAdd(option)
    setQuery("")
    setActive(0)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && open) { event.preventDefault(); setActive((current + 1) % rows.length) }
    else if (event.key === "ArrowUp" && open) { event.preventDefault(); setActive((current - 1 + rows.length) % rows.length) }
    else if ((event.key === "Enter" || event.key === ",") && open) { event.preventDefault(); const row = rows[current]; if (row) pick(row) }
    else if (event.key === "Enter") event.preventDefault()   // never submits the form from here
    else if (event.key === "Escape" && query) { event.preventDefault(); setQuery("") }
    else if (event.key === "Backspace" && !query) { const last = selected.at(-1); if (last) onRemove(last) }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="field-line flex flex-col gap-0.5">
        <label htmlFor={`${id}-input`} className="text-label">{label}</label>
        <input
          id={`${id}-input`}
          name="dish-tags"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${id}-row-${current}` : undefined}
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          disabled={full}
          placeholder={placeholder}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActive(0) }}
          onKeyDown={onKeyDown}
          className="keyboard-focus-ring text-body h-11 w-full bg-transparent placeholder:text-text-muted"
        />
      </div>
      <ul id={`${id}-list`} role="listbox" aria-label={label} hidden={!open}
        className="flex flex-col overflow-hidden rounded-lg bg-surface shadow-md">
        {rows.map((o, i) => (
          <li key={`${o.kind}-${o.key}`} id={`${id}-row-${i}`} role="option" aria-selected={i === current}
            onPointerDown={(event) => { event.preventDefault(); pick(o) }}
            onPointerEnter={() => setActive(i)}
            className="text-body flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 aria-selected:bg-surface-2">
            {o.kind === "custom" && i === suggestions.length ? (
              <span className="flex items-center gap-2"><IconPlus className="h-4 w-4 shrink-0 text-primary" />{addLabel(o.label)}</span>
            ) : (
              <>
                <span>{o.label}</span>
                <span className="text-body-sm">{kindLabel(o.kind)}</span>
              </>
            )}
          </li>
        ))}
      </ul>
      <p id={`${id}-hint`} className="text-body-sm">{hint}</p>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {selected.map((o) => (
            <li key={`${o.kind}-${o.key}`}>
              <Button variant="outlined" size="sm" onClick={() => onRemove(o)} aria-label={`${removeLabel(o.label)} (${kindLabel(o.kind)})`}
                className={TONE[o.kind]} contentClassName="inline-flex items-center gap-1.5">
                {o.label}
                <IconClose className="h-4 w-4 shrink-0" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
