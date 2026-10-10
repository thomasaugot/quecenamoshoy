import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { useHistoryStore } from "@/stores/history-store"

// Ate without asking the app? Straight to the log form on the history page.
export const HomeLog = () => {
  const t = useTranslations("home.log")
  const locale = useLocale()
  const { navigateTo } = useTransition()
  const openEditor = useHistoryStore((s) => s.openEditor)
  const log = async () => {
    await navigateTo(localizedPath("history", locale))
    openEditor("new")
  }
  return (
    <div data-anim="rise" className="invisible flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-note text-text-soft">{t("question")}</p>
      <Button variant="outlined" size="sm" onClick={() => void log()} icon={<IconPlus className="h-4 w-4 shrink-0" />}>{t("cta")}</Button>
    </div>
  )
}
