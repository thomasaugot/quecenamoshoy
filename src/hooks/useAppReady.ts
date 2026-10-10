import { useContext } from "react"
import { AppReadyContext, type AppReadyValue } from "@/contexts/AppReadyContext"

const useAppReadyContext = (): AppReadyValue => {
  const value = useContext(AppReadyContext)
  if (!value) throw new Error("AppReadyContext missing — mount AppReadyProvider in Providers")
  return value
}

export const useAppReady = () => useAppReadyContext().appReady
export const useLoaderGone = () => useAppReadyContext().loaderGone
export const useMarkReady = () => useAppReadyContext().markReady
export const useMarkLoaderGone = () => useAppReadyContext().markLoaderGone
