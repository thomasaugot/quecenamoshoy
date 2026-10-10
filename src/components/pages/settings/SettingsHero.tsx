import { useTranslations } from "use-intl"

export const SettingsHero = () => {
  const t = useTranslations("settings.hero")
  return (
    <header aria-labelledby="settings-title">
      <h1 id="settings-title" data-anim="rise" className="invisible text-title">
        {t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
      </h1>
      <p data-anim="rise" className="invisible text-voice mt-2">{t("note")}</p>
    </header>
  )
}
