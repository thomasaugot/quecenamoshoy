import { IconStar } from "@/components/ui/Icons"

const STARS = [1, 2, 3, 4, 5] as const

// Read-only rating; the label carries the value for screen readers
export const RatingStars = ({ value, label }: { value: number; label: string }) => (
  <span role="img" aria-label={label} className="inline-flex gap-0.5">
    {STARS.map((n) => (
      <IconStar key={n} className={`h-4 w-4 shrink-0 ${n <= value ? "fill-highlight-deep text-highlight-deep" : "text-border"}`} />
    ))}
  </span>
)
