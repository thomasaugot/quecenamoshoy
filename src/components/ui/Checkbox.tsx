import { useId, type ReactNode } from "react"
import { IconCheck } from "@/components/ui/Icons"

// Custom look, native behaviour: a real checkbox, visually hidden, with the box drawn next to
// it (07-UI_PRIMITIVES). Space, label click and screen-reader state come for free.
export const Checkbox = ({ checked, onChange, name, children }: {
  checked: boolean
  onChange: (checked: boolean) => void
  name: string
  children: ReactNode
}) => {
  const id = useId()
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-text bg-surface text-on-primary transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-primary"
      >
        {checked && <IconCheck className="h-4 w-4 shrink-0" />}
      </span>
      <span className="text-body">{children}</span>
    </label>
  )
}
