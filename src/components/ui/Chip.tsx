import type { ReactNode } from "react"
import { Button } from "@/components/ui/Button"
import { IconCheck } from "@/components/ui/Icons"
import type { ChipTone } from "@/types/ui"

// Pressed colour says how strict the rule is: terracotta never, green a way of eating,
// sage "rather not". The check mark carries it too — never colour alone (08).
const PRESSED: Record<ChipTone, string> = {
  hard: "aria-pressed:border-accent-strong aria-pressed:bg-accent-strong aria-pressed:text-on-accent",
  diet: "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary",
  soft: "aria-pressed:border-sage aria-pressed:bg-sage aria-pressed:text-on-primary",
}

export const Chip = ({ pressed, tone, onClick, children }: {
  pressed: boolean
  tone: ChipTone
  onClick: () => void
  children: ReactNode
}) => (
  <Button
    variant="outlined"
    size="sm"
    aria-pressed={pressed}
    onClick={onClick}
    icon={pressed ? <IconCheck className="h-4 w-4 shrink-0" /> : undefined}
    className={`hover:bg-surface-2 ${PRESSED[tone]}`}
  >
    {children}
  </Button>
)
