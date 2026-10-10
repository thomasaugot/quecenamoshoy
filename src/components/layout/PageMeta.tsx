import { useTranslations } from "use-intl"

type MetaPage = "home" | "favourites" | "history" | "dish" | "login" | "notFound" | "wizard" | "roulette" | "settings" | "kitchen"

// React 19 hoists these into <head>. The title also feeds the route announcer (08).
export const PageMeta = ({ page }: { page: MetaPage }) => {
  const t = useTranslations()
  return (
    <>
      <title>{`${t(`${page}.meta.title`)} · ${t("app.shortName")}`}</title>
      <meta name="description" content={t(`${page}.meta.description`)} />
    </>
  )
}
