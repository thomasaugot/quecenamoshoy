import {
  defaultLocale,
  isLocale,
  routeTranslations,
  type Locale,
  type RouteKey,
} from "@/config/i18n.config"

type Params = Record<string, string>

const prefixFor = (locale: Locale) => (locale === defaultLocale ? "" : `/${locale}`)

// The only URL builder. Default locale unprefixed ("as-needed"), others prefixed.
export const localizedPath = (routeKey: RouteKey, locale: Locale, params: Params = {}): string => {
  const slug = (routeTranslations[routeKey][locale] as string).replace(
    /:(\w+)/g,
    (_, name: string) => encodeURIComponent(params[name] ?? ""),
  )
  return `${prefixFor(locale)}/${slug}`.replace(/\/+$/, "") || "/"
}

const stripQueryAndHash = (href: string) => href.split(/[?#]/)[0] ?? ""

// "/en/dish/42?x" → { locale: "en", rest: ["dish", "42"] }
const splitLocale = (href: string): { locale: Locale; rest: string[] } => {
  const parts = stripQueryAndHash(href).split("/").filter(Boolean)
  const [first, ...others] = parts
  return isLocale(first) && first !== defaultLocale
    ? { locale: first, rest: others }
    : { locale: defaultLocale, rest: parts }
}

const matches = (pattern: string, rest: string[]) => {
  const segments = pattern.split("/").filter(Boolean)
  return segments.length === rest.length && segments.every((s, i) => s.startsWith(":") || s === rest[i])
}

// The reverse of localizedPath: which page is this URL? (06-TRANSITIONS preloadRoute)
export const routeKeyFromPath = (href: string): RouteKey | null => {
  const { locale, rest } = splitLocale(href)
  const keys = Object.keys(routeTranslations) as RouteKey[]
  return keys.find((key) => matches(routeTranslations[key][locale], rest)) ?? null
}

// Same page, other language: keeps the dynamic params of the current URL.
export const switchLocalePath = (href: string, routeKey: RouteKey | null, to: Locale): string => {
  if (!routeKey) return localizedPath("home", to)
  const { locale, rest } = splitLocale(href)
  const pattern = routeTranslations[routeKey][locale].split("/").filter(Boolean)
  const params: Params = {}
  pattern.forEach((segment, i) => {
    if (segment.startsWith(":")) params[segment.slice(1)] = decodeURIComponent(rest[i] ?? "")
  })
  return localizedPath(routeKey, to, params)
}
