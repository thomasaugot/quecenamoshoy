import enCommon from "@/locales/en/common.json"
import enError from "@/locales/en/routeError.json"
import esCommon from "@/locales/es/common.json"
import esError from "@/locales/es/routeError.json"
import frCommon from "@/locales/fr/common.json"
import frError from "@/locales/fr/routeError.json"
import { defaultLocale, isLocale } from "@/config/i18n.config"

const COPY = {
  es: { ...esError, reload: esCommon.actions.reload },
  en: { ...enError, reload: enCommon.actions.reload },
  fr: { ...frError, reload: frCommon.actions.reload },
}

// For the crash screen only, which renders outside the IntlProvider.
export const crashCopy = (lang: string) => COPY[isLocale(lang) ? lang : defaultLocale]
