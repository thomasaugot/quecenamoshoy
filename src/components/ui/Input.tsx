import { useId, type InputHTMLAttributes, type Ref } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  ref?: Ref<HTMLInputElement>
}

// Design: a field is a line to write on — small caps label, ink underline, no box.
// A placeholder is never the label (08-ACCESSIBILITY → Forms).
export const Input = ({ label, error, hint, id, className = "", ref, ...rest }: InputProps) => {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <div className="field-line flex flex-col gap-0.5 has-[input[aria-invalid=true]]:border-danger">
        <label htmlFor={inputId} className="text-label">{label}</label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`keyboard-focus-ring text-body h-11 w-full bg-transparent placeholder:text-text-muted ${className}`}
          {...rest}
        />
      </div>
      {hint && !error && <p id={`${inputId}-hint`} className="text-body-sm">{hint}</p>}
      {error && <p id={`${inputId}-error`} role="alert" className="text-body-sm text-danger">{error}</p>}
    </div>
  )
}
