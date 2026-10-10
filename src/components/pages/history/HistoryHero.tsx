import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"
import { useHistoryStore } from "@/stores/history-store"

export const HistoryHero = () => {
  const t = useTranslations("history.hero")
  const openEditor = useHistoryStore((s) => s.openEditor)
  const locale = useLocale()
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div data-anim="rise" className="invisible">
        <h1 className="text-title">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h1>
        <p className="text-voice mt-2">{t("note")}</p>
      </div>
      <div data-anim="rise" className="invisible flex flex-wrap items-center gap-3">
        <TransitionLink href={localizedPath("recap", locale)}
          className="keyboard-focus-ring text-button inline-flex min-h-12 items-center rounded-full border border-border bg-surface px-5 hover:bg-surface-2">
          {t("recap")}
        </TransitionLink>
        <Button onClick={() => openEditor("new")} icon={<IconPlus className="h-5 w-5 shrink-0" />}>{t("log")}</Button>
      </div>
    </header>
  )
}
