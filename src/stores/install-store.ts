import { create } from "zustand"
import type { InstallEvent } from "@/types/install"

// The browser fires beforeinstallprompt ONCE, often before any React component exists: it is
// captured at boot (utils/install.ts) and kept here for whoever offers the install later.
type InstallState = {
  event: InstallEvent | null
  offeredThisSession: boolean
  setEvent: (event: InstallEvent | null) => void
  markOffered: () => void
}

export const useInstallStore = create<InstallState>()((set) => ({
  event: null,
  offeredThisSession: false,
  setEvent: (event) => set({ event }),
  markOffered: () => set({ offeredThisSession: true }),
}))
