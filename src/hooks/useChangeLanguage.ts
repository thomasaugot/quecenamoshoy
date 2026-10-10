import { useLocation } from "react-router"
import { useLocale } from "use-intl"
import type { Locale } from "@/config/i18n.config"
import { useCurrentRouteKey } from "@/hooks/useLocaleData"
import { useTransition } from "@/hooks/useTransition"
import { switchLocalePath } from "@/i18n/paths"

const STORAGE_KEY = "preferred-language"

// Same page in the other language; navigates (never replaceState) so messages change.
export const useChangeLanguage = () => {
  const current = useLocale()
  const routeKey = useCurrentRouteKey()
  const { pathname } = useLocation()
  const { navigateTo } = useTransition()

  return (lang: Locale) => {
    if (lang === current) return
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* private mode: not remembered */ }
    void navigateTo(switchLocalePath(pathname, routeKey, lang))
  }
}
