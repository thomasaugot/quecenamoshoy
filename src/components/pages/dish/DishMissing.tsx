import { useLocale, useTranslations } from "use-intl"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"

export const DishMissing = () => {
  const t = useTranslations("dish.missing")
  const locale = useLocale()
  return (
    <section aria-labelledby="dish-missing" className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-16">
      <h1 id="dish-missing" className="text-title">{t("title")}</h1>
      <TransitionLink href={localizedPath("favourites", locale)} className="keyboard-focus-ring text-button rounded-md text-primary underline underline-offset-4">
        {t("back")}
      </TransitionLink>
    </section>
  )
}
