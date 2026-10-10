import { INSTALL_DISMISS_DAYS, INSTALL_DISMISSED_KEY } from "@/constants/install"
import { useInstallStore } from "@/stores/install-store"
import type { InstallEvent, InstallPlatform } from "@/types/install"

const DAY_MS = 86_400_000

// Called once from main.tsx, before React: never miss the browser's single offer
export const listenForInstallPrompt = () => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    useInstallStore.getState().setEvent(e as InstallEvent)
  })
  window.addEventListener("appinstalled", () => useInstallStore.getState().setEvent(null))
}

export const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches

export const isIosSafari = (userAgent: string) =>
  /iphone|ipad|ipod/i.test(userAgent) && /safari/i.test(userAgent) && !/crios|fxios|edgios/i.test(userAgent)

// How this browser can install: its own prompt, the iOS share-sheet steps, or not at all
export const installPlatform = (hasEvent: boolean, standalone: boolean, userAgent: string): InstallPlatform =>
  standalone ? null : hasEvent ? "prompt" : isIosSafari(userAgent) ? "ios" : null

export const dismissedRecently = (dismissedAt: number | null, now: number) =>
  dismissedAt !== null && now - dismissedAt < INSTALL_DISMISS_DAYS * DAY_MS

export const readDismissedAt = (): number | null => {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISSED_KEY)
    return raw ? Number(raw) || null : null
  } catch {
    return null
  }
}

export const writeDismissedAt = (at: number) => {
  try { localStorage.setItem(INSTALL_DISMISSED_KEY, String(at)) } catch { /* private mode: asked again next time */ }
}
