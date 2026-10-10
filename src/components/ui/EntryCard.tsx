import { IconArrow } from "@/components/ui/Icons"
import { TransitionLink } from "@/components/ui/TransitionLink"

type EntryTone = "primary" | "paper"

const TONE: Record<EntryTone, { card: string; note: string }> = {
  primary: { card: "bg-primary text-on-primary hover:bg-primary-hover", note: "text-on-primary" },
  paper: { card: "border border-border bg-surface text-text hover:bg-surface-2", note: "text-accent-strong" },
}

// A big, thumb-sized way into a flow: serif title, handwritten promise, arrow.
export const EntryCard = ({ href, title, note, tone }: { href: string; title: string; note: string; tone: EntryTone }) => (
  <TransitionLink
    href={href}
    className={`keyboard-focus-ring flex min-h-36 flex-col justify-between gap-4 rounded-xl p-5 shadow-md transition-colors lg:min-h-44 lg:p-6 ${TONE[tone].card}`}
  >
    <span className="text-heading">{title}</span>
    <span className="flex items-end justify-between gap-2">
      <span className={`text-note ${TONE[tone].note}`}>{note}</span>
      <IconArrow className="h-5 w-5 shrink-0" />
    </span>
  </TransitionLink>
)
