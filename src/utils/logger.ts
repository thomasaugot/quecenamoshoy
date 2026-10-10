import { appConfig } from "@/config/app.config"

/* eslint-disable no-console -- this file IS the console wrapper */
// Never pass tokens, request bodies or personal data here (11-SECURITY → Logging).
export const logger = {
  debug: (...args: unknown[]) => { if (appConfig.isDev) console.debug(...args) },
  info: (...args: unknown[]) => { if (appConfig.isDev) console.info(...args) },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
}
