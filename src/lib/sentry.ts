import * as Sentry from "@sentry/react"
import { useEffect } from "react"
import {
  createBrowserRouter, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType,
} from "react-router"
import { appConfig } from "@/config/app.config"

// Off unless a DSN is set, and only in production builds: dev, tests and CI never report.
export const sentryEnabled = Boolean(appConfig.sentryDsn) && appConfig.isProd

export const initSentry = () => {
  if (!sentryEnabled || !appConfig.sentryDsn) return
  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: window.location.origin,
    tracesSampleRate: 0.1,
    // Sentry 11 defaults collect bodies, headers, cookies and user info: all off — no
    // personal data leaves the app (11-SECURITY → Logging).
    dataCollection: {
      userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false,
    },
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes,
      }),
    ],
    // never our bug, and they burn the free quota (13-MONITORING)
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "AbortError",
      "Non-Error promise rejection captured",
    ],
    denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-(web-)?extension:\/\//],
  })
}

export const createRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)
export const reactErrorHandler = Sentry.reactErrorHandler
export const captureException = Sentry.captureException
export const SentryErrorBoundary = Sentry.ErrorBoundary
