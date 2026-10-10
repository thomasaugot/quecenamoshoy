import { useTranslations } from "use-intl"

export const FavouritesHero = () => {
  const t = useTranslations("favourites.hero")
  return (
    <section aria-labelledby="favourites-title" className="mx-auto max-w-5xl px-4 py-10">
      <h1 id="favourites-title" className="text-title">{t("title")}</h1>
    </section>
  )
}
