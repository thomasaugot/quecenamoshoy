import { useLocale, useTranslations } from "use-intl"
import { EntryCard } from "@/components/ui/EntryCard"
import { localizedPath } from "@/i18n/paths"

export const HomeEntries = () => {
  const t = useTranslations("home")
  const locale = useLocale()
  return (
    <nav aria-label={t("question")} data-anim="rise" className="invisible grid grid-cols-2 gap-3 lg:gap-4">
      <EntryCard href={localizedPath("wizard", locale)} title={t("entries.ask.title")} note={t("entries.ask.note")} tone="primary" />
      <EntryCard href={localizedPath("roulette", locale)} title={t("entries.roulette.title")} note={t("entries.roulette.note")} tone="paper" />
    </nav>
  )
}
