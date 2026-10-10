import { useEffect } from "react"
import { useRouteError } from "react-router"
import { useLocale, useTranslations } from "use-intl"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"
import { captureException } from "@/lib/sentry"
import { logger } from "@/utils/logger"

// The router's errorElement (04-CLIENT_SERVER). Reports, never shows error.message.
export const RouteError = () => {
  const error = useRouteError()
  const t = useTranslations()
  const locale = useLocale()

  useEffect(() => {
    logger.error("route error", error)
    captureException(error)
  }, [error])

  return (
    <section aria-labelledby="route-error-title" className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
      <h1 id="route-error-title" className="text-title">{t("routeError.title")}</h1>
      <p className="text-body">{t("routeError.body")}</p>
      <TransitionLink href={localizedPath("home", locale)} className="keyboard-focus-ring text-button self-start rounded-lg bg-primary px-4 py-3 text-on-primary">
        {t("actions.goHome")}
      </TransitionLink>
    </section>
  )
}
