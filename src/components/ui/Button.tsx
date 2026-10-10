import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "filled" | "outlined" | "ghost" | "link"
type ButtonSize = "sm" | "md" | "lg" | "icon"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  contentClassName?: string   // layout of the label wrapper, e.g. a stacked card
}

// Design (docs/design.html): pills. Filled = kitchen green, outlined = white on a hairline,
// link = underlined green text.
const VARIANT: Record<ButtonVariant, string> = {
  filled: "rounded-full bg-primary text-on-primary hover:bg-primary-hover",
  outlined: "rounded-full border border-border bg-surface text-text hover:bg-surface-2",
  ghost: "rounded-full bg-transparent text-text hover:bg-surface-2",
  link: "bg-transparent text-primary underline underline-offset-4 hover:text-primary-hover",
}

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 gap-1.5",
  md: "min-h-12 px-5 gap-2",
  lg: "min-h-15 px-6 gap-2.5",
  icon: "min-h-10 min-w-10 p-2",
}

// type defaults to "button": a native <button> is "submit" by default (07-UI_PRIMITIVES).
export const Button = ({
  variant = "filled", size = "md", loading = false, icon, type = "button", contentClassName = "",
  disabled, className = "", children, ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`keyboard-focus-ring text-button inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${variant === "link" ? "min-h-11 px-1" : SIZE[size]} ${className}`}
    {...rest}
  >
    {icon && <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>}
    {children !== undefined && <span className={`${loading ? "opacity-70" : ""} ${contentClassName}`.trim() || undefined}>{children}</span>}
  </button>
)
