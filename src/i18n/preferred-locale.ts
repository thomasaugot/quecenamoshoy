import { defaultLocale, isLocale, locales, type Locale } from "@/config/i18n.config"
import { routeKeyFromPath, switchLocalePath } from "@/i18n/paths"

const STORAGE_KEY = "preferred-language"

export const readPreferredLocale = (): Locale | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export const writePreferredLocale = (locale: Locale): void => {
  try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* private mode: not remembered */ }
}

// The browser's own languages, first supported one — only for a first visit with no choice yet
const browserLocale = (): Locale | null =>
  navigator.languages.map((l) => l.slice(0, 2)).find((l): l is Locale => (locales as readonly string[]).includes(l)) ?? null

// Where the app should really open. An unprefixed (default-language) URL is what the
// home-screen icon and bookmarks open, so it follows the language I chose; with no choice
// yet, the bare home follows the browser's language once. A prefixed URL (/fr/…) is
// explicit and always wins. Null = stay.
export const preferredStartPath = (pathname: string): string | null => {
  const first = pathname.split("/").filter(Boolean)[0]
  if (isLocale(first) && first !== defaultLocale) return null
  // a path that is no page of the app (a dev preview, a 404) stays as typed: there is no
  // translated version of it to send it to
  const routeKey = routeKeyFromPath(pathname)
  if (!routeKey) return null
  const preferred = readPreferredLocale() ?? (pathname === "/" ? browserLocale() : null)
  if (!preferred || preferred === defaultLocale) return null
  return switchLocalePath(pathname, routeKey, preferred)
}
