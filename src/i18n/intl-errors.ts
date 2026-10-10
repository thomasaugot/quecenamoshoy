import type { IntlError } from "use-intl"
import { appConfig } from "@/config/app.config"
import { logger } from "@/utils/logger"

// Never the console default, never a throw in production (09-I18N → Missing keys).
export const onIntlError = (error: IntlError) => logger.error("i18n", error.code, error.originalMessage)

// A key missing in EVERY locale (the default locale is already the fallback layer):
// visible while building, invisible to the user.
export const messageFallback = ({ namespace, key }: { namespace?: string; key: string }) =>
  appConfig.isDev ? [namespace, key].filter(Boolean).join(".") : ""
