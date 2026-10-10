import type { Locale } from "@/config/i18n.config"

// Built from the DEFAULT locale: a wrong key or namespace is a tsc error (09-I18N).
// A page missing here cannot be translated at all — the error itself says to add it.
type Messages = typeof import("@/locales/es/common.json") & {
  home: typeof import("@/locales/es/home.json")
  favourites: typeof import("@/locales/es/favourites.json")
  history: typeof import("@/locales/es/history.json")
  dish: typeof import("@/locales/es/dish.json")
  login: typeof import("@/locales/es/login.json")
  notFound: typeof import("@/locales/es/notFound.json")
  routeError: typeof import("@/locales/es/routeError.json")
}

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}
