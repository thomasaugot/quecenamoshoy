import { useEffect, useId, useRef, type ReactNode } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconClose } from "@/components/ui/Icons"
import { useScroll } from "@/hooks/useScroll"

// Native <dialog> + showModal(): focus trap, Escape, focus return, inert page and the top
// layer come from the browser (07-UI_PRIMITIVES). <dialog> does not lock page scroll, so
// Lenis and the document are locked while it is open.
const SIZE = {
  md: { dialog: "m-auto max-h-[92svh] w-[min(40rem,calc(100vw-2rem))] rounded-xl shadow-xl", body: "max-h-[92svh] p-6 lg:p-8" },
  // the whole screen: cooking mode, read from across the kitchen
  full: { dialog: "m-0 h-svh max-h-none w-screen max-w-none rounded-none", body: "h-svh p-5 lg:p-10" },
  // a sheet rising from the bottom edge, the page dimmed behind: results that must not be missed
  sheet: {
    dialog: "animate-sheet mx-auto mt-auto mb-0 max-h-[85svh] w-full max-w-md rounded-t-2xl shadow-xl",
    body: "max-h-[85svh] px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
  },
} as const

export const Modal = ({ isOpen, onClose, title, children, size = "md" }: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: keyof typeof SIZE
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
      className={`bg-bg p-0 text-text ${SIZE[size].dialog}`}
    >
      {isOpen && (
        <div data-lenis-prevent className={`flex flex-col overflow-y-auto ${SIZE[size].body}`}>
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
