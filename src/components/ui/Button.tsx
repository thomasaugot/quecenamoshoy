import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "filled" | "outlined" | "ghost"
type ButtonSize = "sm" | "md" | "lg" | "icon"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const VARIANT: Record<ButtonVariant, string> = {
  filled: "bg-primary text-on-primary hover:bg-primary-hover",
  outlined: "border border-border bg-surface text-text hover:bg-surface-2",
  ghost: "bg-transparent text-text hover:bg-surface-2",
}

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 gap-1.5",
  md: "min-h-11 px-4 gap-2",
  lg: "min-h-14 px-6 gap-2.5",
  icon: "min-h-10 min-w-10 p-2",
}

// type defaults to "button": a native <button> is "submit" by default (07-UI_PRIMITIVES).
export const Button = ({
  variant = "filled", size = "md", loading = false, icon, type = "button",
  disabled, className = "", children, ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`keyboard-focus-ring text-button inline-flex items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    {...rest}
  >
    {icon && <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>}
    {children !== undefined && <span className={loading ? "opacity-70" : undefined}>{children}</span>}
  </button>
)
