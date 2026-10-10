import { useEffect } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconAlert, IconCheck, IconClose, IconInfo } from "@/components/ui/Icons"
import { useToastStore } from "@/stores/toast-store"
import { TOAST_DURATION, type Toast } from "@/types/toast"
import { announce } from "@/utils/announce"

const ICON = { success: IconCheck, info: IconInfo, warning: IconAlert, error: IconAlert } as const
const TONE = {
  success: "text-success", info: "text-info", warning: "text-warning", error: "text-danger",
} as const

// The dismiss timer starts when the toast MOUNTS, i.e. once the loader is gone.
export const ToastItem = ({ toast }: { toast: Toast }) => {
  const t = useTranslations("actions")
  const dismiss = useToastStore((s) => s.dismiss)
  const Icon = ICON[toast.type]

  useEffect(() => {
    announce(toast.message, toast.type === "error" ? "assertive" : "polite")
    const timer = setTimeout(() => dismiss(toast.id), TOAST_DURATION[toast.type])
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  return (
    <li className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg">
      <Icon className={`mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 ${TONE[toast.type]}`} />
      <p className="text-body grow">{toast.message}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => dismiss(toast.id)}
        aria-label={t("close")}
        icon={<IconClose className="h-4 w-4 shrink-0" />}
        className="-m-2 shrink-0 text-text-muted"
      />
    </li>
  )
}
