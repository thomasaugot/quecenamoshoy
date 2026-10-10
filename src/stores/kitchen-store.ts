import { create } from "zustand"
import type { KitchenLocation } from "@/types/database"

// Which kitchen the page shows: home, or the smaller travelling one (brief §3.6)
type KitchenState = { location: KitchenLocation; setLocation: (location: KitchenLocation) => void }

export const useKitchenStore = create<KitchenState>()((set) => ({
  location: "home",
  setLocation: (location) => set({ location }),
}))
