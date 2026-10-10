import { useSyncExternalStore } from "react"
import { useInstallStore } from "@/stores/install-store"
import { installPlatform, isStandalone } from "@/utils/install"

const subscribeStandalone = (onChange: () => void) => {
  const media = window.matchMedia("(display-mode: standalone)")
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

// How this browser can install the app ("prompt" / "ios" / null once installed or impossible)
export const useInstallPrompt = () => {
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone)
  const event = useInstallStore((s) => s.event)
  const setEvent = useInstallStore((s) => s.setEvent)
  const platform = installPlatform(!!event, standalone, navigator.userAgent)

  // Resolves true when installed through the browser's own prompt
  const install = async (): Promise<boolean> => {
    if (!event) return false
    await event.prompt()
    const { outcome } = await event.userChoice
    setEvent(null)
    return outcome === "accepted"
  }

  return { platform, canInstall: platform === "prompt", showIosHint: platform === "ios", install }
}
