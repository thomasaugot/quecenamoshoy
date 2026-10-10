import type { ComponentType } from "react"
import type { RouteObject } from "react-router"
import { RequireAuth } from "@/components/layout/RequireAuth"
import { RootLayout } from "@/components/layout/RootLayout"
import { RouteError } from "@/components/layout/RouteError"
import { HomePage } from "@/components/pages/home/HomePage"
import { routeModules } from "@/app/route-modules"
import { defaultLocale, locales, routeTranslations, type Locale } from "@/config/i18n.config"
import { loadMessages } from "@/i18n/messages"
import { createRouter } from "@/lib/sentry"

// Lazy route from the SAME import preloadRoute uses (06-TRANSITIONS).
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  async () => ({ Component: (await load())[name] })

const localeBranch = (locale: Locale): RouteObject => ({
  id: `locale-${locale}`,
  path: locale === defaultLocale ? "/" : `/${locale}`,
  loader: () => loadMessages(locale),
  handle: { locale },
  children: [
    {
      errorElement: <RouteError />,   // pathless: errors render inside the layout, nav stays
      children: [
        { path: routeTranslations.login[locale], handle: { routeKey: "login" }, lazy: page(routeModules.login, "LoginPage") },
        {
          element: <RequireAuth />,
          children: [
            { index: true, handle: { routeKey: "home" }, element: <HomePage /> },   // first screen: static
            { path: routeTranslations.favourites[locale], handle: { routeKey: "favourites" }, lazy: page(routeModules.favourites, "FavouritesPage") },
            { path: routeTranslations.history[locale], handle: { routeKey: "history" }, lazy: page(routeModules.history, "HistoryPage") },
            { path: routeTranslations.dish[locale], handle: { routeKey: "dish" }, lazy: page(routeModules.dish, "DishPage") },
            { path: routeTranslations.wizard[locale], handle: { routeKey: "wizard" }, lazy: page(routeModules.wizard, "WizardPage") },
            { path: routeTranslations.roulette[locale], handle: { routeKey: "roulette" }, lazy: page(routeModules.roulette, "RoulettePage") },
            { path: routeTranslations.settings[locale], handle: { routeKey: "settings" }, lazy: page(routeModules.settings, "SettingsPage") },
            { path: routeTranslations.kitchen[locale], handle: { routeKey: "kitchen" }, lazy: page(routeModules.kitchen, "KitchenPage") },
            { path: routeTranslations.shopping[locale], handle: { routeKey: "shopping" }, lazy: page(routeModules.shopping, "ShoppingPage") },
            { path: routeTranslations.recap[locale], handle: { routeKey: "recap" }, lazy: page(routeModules.recap, "RecapPage") },
          ],
        },
        { path: "*", lazy: page(routeModules.notFound, "NotFoundPage") },
      ],
    },
  ],
})

// The ONLY place routes are declared (04-CLIENT_SERVER). One branch per locale (09-I18N).
// hydrateFallbackElement on the ROOT: until the first locale's messages are loaded nothing
// renders — RootLayout needs those messages (an empty fallback lower down let it render without).
export const router = createRouter([
  { element: <RootLayout />, hydrateFallbackElement: <></>, children: locales.map(localeBranch) },
])
