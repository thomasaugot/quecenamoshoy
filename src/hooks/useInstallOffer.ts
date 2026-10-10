import { useEffect, useState } from "react"
import { INSTALL_OFFER_DELAY_MS } from "@/constants/install"
import { useLoaderGone } from "@/hooks/useAppReady"
import { useAuth } from "@/hooks/useAuth"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { useInstallStore } from "@/stores/install-store"
import { dismissedRecently, readDismissedAt, writeDismissedAt } from "@/utils/install"

// When to OFFER the install: signed in, the loader gone, a few seconds in (never on page
// load), once a session, and not within two weeks of "más tarde" (build-progressive-web-app §6).
export const useInstallOffer = () => {
  const { session } = useAuth()
  const loaderGone = useLoaderGone()
  const { platform } = useInstallPrompt()
  const offered = useInstallStore((s) => s.offeredThisSession)
  const markOffered = useInstallStore((s) => s.markOffered)
  const [open, setOpen] = useState(false)
  const eligible = !!session && loaderGone && platform !== null && !offered

  useEffect(() => {
    if (!eligible || dismissedRecently(readDismissedAt(), Date.now())) return
    const timer = setTimeout(() => { markOffered(); setOpen(true) }, INSTALL_OFFER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [eligible, markOffered])

  const later = () => { writeDismissedAt(Date.now()); setOpen(false) }
  return { open: open && platform !== null, platform, close: () => setOpen(false), later }
}
