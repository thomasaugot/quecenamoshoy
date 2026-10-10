import { Button } from "@/components/ui/Button"
import { IconMinus, IconPlus } from "@/components/ui/Icons"

// A small number you nudge: − value +. The value is announced through its group label.
export const Stepper = ({ value, min, max, onChange, label, decreaseLabel, increaseLabel, unit }: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label: string
  decreaseLabel: string
  increaseLabel: string
  unit?: string
}) => (
  <div role="group" aria-label={label} className="flex items-center gap-1">
    <Button variant="outlined" size="icon" aria-label={decreaseLabel} disabled={value <= min}
      onClick={() => onChange(value - 1)} icon={<IconMinus className="h-4 w-4 shrink-0" />} />
    <output aria-live="polite" className="text-voice min-w-14 text-center">
      {value}{unit && <span className="text-body-sm"> {unit}</span>}
    </output>
    <Button variant="outlined" size="icon" aria-label={increaseLabel} disabled={value >= max}
      onClick={() => onChange(value + 1)} icon={<IconPlus className="h-4 w-4 shrink-0" />} />
  </div>
)
