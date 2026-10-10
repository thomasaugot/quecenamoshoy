import { useEffect, useId, useRef, type ReactNode } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconClose } from "@/components/ui/Icons"
import { useScroll } from "@/hooks/useScroll"

// Native <dialog> + showModal(): focus trap, Escape, focus return, inert page and the top
// layer come from the browser (07-UI_PRIMITIVES). <dialog> does not lock page scroll, so
// Lenis and the document are locked while it is open.
export const Modal = ({ isOpen, onClose, title, children }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) => {
  const t = useTranslations()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { setLocked } = useScroll()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
    setLocked(isOpen)
    return () => setLocked(false)
  }, [isOpen, setLocked])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === ref.current) onClose() }}
      className="m-auto max-h-[92svh] w-[min(40rem,calc(100vw-2rem))] rounded-xl bg-bg p-0 text-text shadow-xl"
    >
      {isOpen && (
        <div data-lenis-prevent className="flex max-h-[92svh] flex-col overflow-y-auto p-6 lg:p-8">
          <header className="mb-6 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-heading">{title}</h2>
            <Button variant="ghost" size="icon" aria-label={t("actions.close")} onClick={onClose}
              icon={<IconClose className="h-5 w-5 shrink-0" />} />
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
