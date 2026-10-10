import { useLocale, useTranslations } from "use-intl"
import { locales } from "@/config/i18n.config"
import { Button } from "@/components/ui/Button"
import { useChangeLanguage } from "@/hooks/useChangeLanguage"

// Three toggle buttons, not a <select>: one tap on a phone, and no Dropdown needed for 3 items.
export const LanguageSwitcher = () => {
  const t = useTranslations()
  const current = useLocale()
  const changeLanguage = useChangeLanguage()
  return (
    <div role="group" aria-label={t("a11y.language")} className="flex items-center gap-1">
      {locales.map((lang) => (
        <Button
          key={lang}
          variant="ghost"
          size="sm"
          lang={lang}
          aria-pressed={lang === current}
          aria-label={t(`languages.${lang}`)}
          onClick={() => changeLanguage(lang)}
          className="uppercase text-text-muted aria-pressed:bg-surface-2 aria-pressed:text-text"
        >
          {lang}
        </Button>
      ))}
    </div>
  )
}
