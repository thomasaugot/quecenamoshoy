import { useLocation } from "react-router"
import { useLocale } from "use-intl"
import type { Locale } from "@/config/i18n.config"
import { useCurrentRouteKey } from "@/hooks/useLocaleData"
import { useTransition } from "@/hooks/useTransition"
import { switchLocalePath } from "@/i18n/paths"
import { writePreferredLocale } from "@/i18n/preferred-locale"

// Same page in the other language; navigates (never replaceState) so messages change.
// The choice is remembered: the next launch opens in it (i18n/restore-locale.ts).
export const useChangeLanguage = () => {
  const current = useLocale()
  const routeKey = useCurrentRouteKey()
  const { pathname } = useLocation()
  const { navigateTo } = useTransition()

  return (lang: Locale) => {
    if (lang === current) return
    writePreferredLocale(lang)
    void navigateTo(switchLocalePath(pathname, routeKey, lang))
  }
}
