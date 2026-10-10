import { useEffect, useState, useSyncExternalStore } from "react"

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

const STANDALONE = "(display-mode: standalone)"
const subscribeStandalone = (onChange: () => void) => {
  const media = window.matchMedia(STANDALONE)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

const isIosSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)

// Install only when the browser offers it (Chrome/Android: beforeinstallprompt); on iOS
// Safari, which never offers it, a one-line hint. Nothing once installed.
export const useInstallPrompt = () => {
  const installed = useSyncExternalStore(subscribeStandalone, () => window.matchMedia(STANDALONE).matches)
  const [event, setEvent] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const capture = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent) }
    const done = () => setEvent(null)
    window.addEventListener("beforeinstallprompt", capture)
    window.addEventListener("appinstalled", done)
    return () => {
      window.removeEventListener("beforeinstallprompt", capture)
      window.removeEventListener("appinstalled", done)
    }
  }, [])

  const install = async () => {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setEvent(null)
  }

  return { canInstall: !installed && !!event, showIosHint: !installed && !event && isIosSafari(), install }
}
