import { useEffect } from "react"
import { Outlet } from "react-router"
import { IntlProvider } from "use-intl"
import { BottomTabs } from "@/components/layout/BottomTabs"
import { Navbar } from "@/components/layout/Navbar"
import { PageShell } from "@/components/layout/PageShell"
import { Providers } from "@/components/layout/Providers"
import { SkipLink } from "@/components/ui/SkipLink"
import { appConfig } from "@/config/app.config"
import { useLocaleData } from "@/hooks/useLocaleData"
import { onIntlError, messageFallback } from "@/i18n/intl-errors"

// Pathless root route ABOVE the locale branches: a language switch does not remount the
// providers, the loader, Lenis or the navbar (09-I18N).
export const RootLayout = () => {
  const { locale, messages } = useLocaleData()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <IntlProvider
      locale={locale}
      messages={messages}
      timeZone={appConfig.timeZone}
      onError={onIntlError}
      getMessageFallback={messageFallback}
    >
      <Providers>
        <SkipLink targetId="main-content" />
        <Navbar />
        <PageShell>
          <Outlet />
        </PageShell>
        <BottomTabs />
      </Providers>
    </IntlProvider>
  )
}
