import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import type { ReactNode } from "react"
import { PageLoader } from "@/components/layout/PageLoader"
import { LiveRegion } from "@/components/ui/LiveRegion"
import { Toaster } from "@/components/ui/Toaster"
import { AppReadyProvider } from "@/contexts/AppReadyContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { MotionPreferenceProvider } from "@/contexts/MotionPreferenceContext"
import { ScrollProvider } from "@/contexts/ScrollContext"
import { TransitionProvider } from "@/contexts/TransitionContext"
import { OfflineBanner } from "@/components/ui/OfflineBanner"
import { UpdatePrompt } from "@/components/ui/UpdatePrompt"
import { persistOptions, queryClient } from "@/lib/query-client"

// Mounted INSIDE the router (RootLayout): TransitionProvider uses useNavigate (04-CLIENT_SERVER).
export const Providers = ({ children }: { children: ReactNode }) => (
  <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
    <AuthProvider>
      <AppReadyProvider>
        <ScrollProvider>
          <TransitionProvider>
            <MotionPreferenceProvider>
              <PageLoader />
              {children}
              <Toaster />
              <UpdatePrompt />
              <OfflineBanner />
              <LiveRegion />
            </MotionPreferenceProvider>
          </TransitionProvider>
        </ScrollProvider>
      </AppReadyProvider>
    </AuthProvider>
  </PersistQueryClientProvider>
)
