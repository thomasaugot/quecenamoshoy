import { useTranslations } from "use-intl"

export const RouletteHero = () => {
  const t = useTranslations("roulette.hero")
  return (
    <header data-anim="rise" className="invisible">
      <h1 className="text-title">{t.rich("title", { em: (chunks) => <em>{chunks}</em> })}</h1>
      <p className="text-voice mt-2">{t("note")}</p>
    </header>
  )
}
