import { useMatches, useRouteLoaderData } from "react-router"
import { defaultLocale, isLocale, type Locale, type RouteKey } from "@/config/i18n.config"
import type { Messages } from "@/types/i18n"

const handleOf = (handle: unknown): { locale?: unknown; routeKey?: unknown } =>
  typeof handle === "object" && handle !== null ? handle : {}

// Current locale + messages, read from the MATCHED route — never parsed from the pathname.
export const useLocaleData = (): { locale: Locale; messages: Messages | undefined } => {
  const found = useMatches().map((m) => handleOf(m.handle).locale).find(isLocale)
  const locale = found ?? defaultLocale
  const messages = useRouteLoaderData(`locale-${locale}`) as Messages | undefined
  return { locale, messages }
}

export const useCurrentRouteKey = (): RouteKey | null => {
  const keys = useMatches().map((m) => handleOf(m.handle).routeKey)
  const last = keys.filter((k): k is RouteKey => typeof k === "string").pop()
  return last ?? null
}
