import { useTranslations } from "use-intl"

export const HomeHero = () => {
  const t = useTranslations("home.hero")
  return (
    <section aria-labelledby="home-title" className="mx-auto max-w-5xl px-4 py-10">
      <h1 id="home-title" className="text-title">{t("title")}</h1>
    </section>
  )
}
