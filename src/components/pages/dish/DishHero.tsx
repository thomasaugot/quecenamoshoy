import { useTranslations } from "use-intl"

export const DishHero = () => {
  const t = useTranslations("dish.hero")
  return (
    <section aria-labelledby="dish-title" className="mx-auto max-w-5xl px-4 py-10">
      <h1 id="dish-title" className="text-title">{t("title")}</h1>
    </section>
  )
}
