import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { useHistoryStore } from "@/stores/history-store"

export const HistoryHero = () => {
  const t = useTranslations("history.hero")
  const openEditor = useHistoryStore((s) => s.openEditor)
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div data-anim="rise" className="invisible">
        <h1 className="text-title">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h1>
        <p className="text-voice mt-2">{t("note")}</p>
      </div>
      <div data-anim="rise" className="invisible">
        <Button onClick={() => openEditor("new")} icon={<IconPlus className="h-5 w-5 shrink-0" />}>{t("log")}</Button>
      </div>
    </header>
  )
}
