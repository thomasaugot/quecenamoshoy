import "@fontsource-variable/inter"
import "@/globals.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import { router } from "@/app/router"
import { AppCrash } from "@/components/layout/AppCrash"
import { initSentry, reactErrorHandler, SentryErrorBoundary } from "@/lib/sentry"
import { reloadOnStaleChunk } from "@/utils/stale-chunk"

initSentry()
reloadOnStaleChunk()

const root = document.getElementById("root")
if (!root) throw new Error("#root not found in index.html")

createRoot(root, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<AppCrash />}>
      <RouterProvider router={router} />
    </SentryErrorBoundary>
  </StrictMode>,
)
