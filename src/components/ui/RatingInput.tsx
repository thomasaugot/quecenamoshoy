import { Button } from "@/components/ui/Button"
import { IconStar } from "@/components/ui/Icons"

const STARS = [1, 2, 3, 4, 5] as const

// Five stars; tapping the current rating again clears it (a rating is optional).
export const RatingInput = ({ value, onChange, label, starLabel }: {
  value: number | null
  onChange: (value: number | null) => void
  label: string
  starLabel: (stars: number) => string
}) => (
  <div role="group" aria-label={label} className="flex gap-0.5">
    {STARS.map((n) => (
      <Button
        key={n}
        variant="ghost"
        size="icon"
        aria-pressed={value === n}
        aria-label={starLabel(n)}
        onClick={() => onChange(value === n ? null : n)}
        icon={<IconStar className={`h-6 w-6 shrink-0 ${value !== null && n <= value ? "fill-highlight-deep text-highlight-deep" : "text-text-muted"}`} />}
      />
    ))}
  </div>
)
