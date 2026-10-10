import { useTranslations } from "use-intl"

export const HistoryHero = () => {
  const t = useTranslations("history.hero")
  return (
    <section aria-labelledby="history-title" className="mx-auto max-w-5xl px-4 py-10">
      <h1 id="history-title" className="text-title">{t("title")}</h1>
    </section>
  )
}
