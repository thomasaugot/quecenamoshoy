import { useId, type InputHTMLAttributes, type Ref } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

// A placeholder is never a label (08-ACCESSIBILITY → Forms).
export const Input = ({ label, error, hint, id, className = "", ref, ...rest }: InputProps) => {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-label text-text-muted">{label}</label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`keyboard-focus-ring text-body min-h-12 rounded-lg border border-border bg-surface px-4 aria-invalid:border-danger ${className}`}
        {...rest}
      />
      {hint && !error && <p id={`${inputId}-hint`} className="text-body-sm">{hint}</p>}
      {error && <p id={`${inputId}-error`} role="alert" className="text-body-sm text-danger">{error}</p>}
    </div>
  )
}
