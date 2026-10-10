import { createContext, useEffect, useState, type ReactNode } from "react"

export type AppReadyValue = {
  appReady: boolean
  loaderGone: boolean
  markReady: () => void
  markLoaderGone: () => void
}

export const AppReadyContext = createContext<AppReadyValue | null>(null)

// appReady = content ready (fonts, min delay). loaderGone = the PageLoader has finished its
// exit and unmounted. Both are one-shot boot flags (05-ANIMATIONS).
export const AppReadyProvider = ({ children }: { children: ReactNode }) => {
  const [appReady, setAppReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const markReady = () => setAppReady(true)
  const markLoaderGone = () => setLoaderGone(true)

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", !appReady)
    return () => document.body.classList.remove("overflow-hidden")
  }, [appReady])

  const value = { appReady, loaderGone, markReady, markLoaderGone }
  return <AppReadyContext.Provider value={value}>{children}</AppReadyContext.Provider>
}
