import { useLocale, useTranslations } from "use-intl"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"

export const NotFoundHero = () => {
  const t = useTranslations()
  const locale = useLocale()
  return (
    <section aria-labelledby="not-found-title" className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
      <h1 id="not-found-title" className="text-title">{t("notFound.hero.title")}</h1>
      <p className="text-body">{t("notFound.hero.body")}</p>
      <TransitionLink href={localizedPath("home", locale)} className="keyboard-focus-ring text-button self-start rounded-lg bg-primary px-4 py-3 text-on-primary">
        {t("actions.goHome")}
      </TransitionLink>
    </section>
  )
}
