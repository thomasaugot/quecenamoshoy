export const locales = ["es", "en", "fr"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "es"

// routeKey → slug per locale. "" = the locale's home. Dynamic segments keep their :param.
export const routeTranslations = {
  home:       { es: "",               en: "",               fr: "" },
  favourites: { es: "favoritos",      en: "favourites",     fr: "favoris" },
  history:    { es: "historial",      en: "history",        fr: "historique" },
  dish:       { es: "plato/:dishId",  en: "dish/:dishId",   fr: "plat/:dishId" },
  wizard:     { es: "preguntame",     en: "ask-me",         fr: "demande-moi" },
  roulette:   { es: "ruleta",         en: "roulette",       fr: "roulette" },
  settings:   { es: "ajustes",        en: "settings",       fr: "reglages" },
  kitchen:    { es: "cocina",         en: "kitchen",        fr: "cuisine" },
  shopping:   { es: "lista-compra",   en: "shopping-list",  fr: "liste-courses" },
  recap:      { es: "resumen",        en: "recap",          fr: "bilan" },
  login:      { es: "entrar",         en: "login",          fr: "connexion" },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteKey = keyof typeof routeTranslations

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value)
