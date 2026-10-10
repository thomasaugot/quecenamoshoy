import { lazy, Suspense } from "react"
import { useInstallOffer } from "@/hooks/useInstallOffer"

// Opened on demand: the modal is its own chunk (14-PERFORMANCE)
const InstallModal = lazy(() => import("@/components/ui/InstallModal").then((m) => ({ default: m.InstallModal })))

// Always mounted (RootLayout); renders nothing until it's the right moment to offer the install.
export const InstallOffer = () => {
  const { open, platform, close, later } = useInstallOffer()
  if (!open || !platform) return null
  return (
    <Suspense fallback={null}>
      <InstallModal platform={platform} onClose={close} onLater={later} />
    </Suspense>
  )
}
