import { create } from "zustand"
import type { KitchenLocation } from "@/types/database"
import type { RoulettePreference, WheelSlot } from "@/types/roulette"

// The roulette's UI state: tonight (where, who), the preference, the wheel and where it stopped.
type RouletteState = {
  location: KitchenLocation
  diners: string[]
  guests: number
  editingTonight: boolean
  preference: RoulettePreference
  slots: WheelSlot[]
  rotation: number              // degrees, total — the wheel keeps turning forward
  winner: number | null         // index in slots
  spinning: boolean
  setTonight: (patch: Partial<Pick<RouletteState, "location" | "diners" | "guests">>) => void
  setEditingTonight: (editing: boolean) => void
  setPreference: (patch: Partial<RoulettePreference>) => void
  load: (slots: WheelSlot[]) => void
  startSpin: (slots: WheelSlot[], winner: number, rotation: number) => void
  endSpin: () => void
  init: (tonight: { location: KitchenLocation; diners: string[]; guests: number; editing: boolean }) => void
}

export const useRouletteStore = create<RouletteState>()((set) => ({
  location: "home",
  diners: [],
  guests: 0,
  editingTonight: false,
  preference: { chips: [], text: "" },
  slots: [],
  rotation: 0,
  winner: null,
  spinning: false,
  setTonight: (patch) => set(patch),
  setEditingTonight: (editingTonight) => set({ editingTonight }),
  setPreference: (patch) => set((s) => ({ preference: { ...s.preference, ...patch } })),
  load: (slots) => set({ slots, winner: null }),
  startSpin: (slots, winner, rotation) => set({ slots, winner, rotation, spinning: true }),
  endSpin: () => set({ spinning: false }),
  init: ({ editing, ...tonight }) =>
    set({ ...tonight, editingTonight: editing, preference: { chips: [], text: "" }, slots: [], winner: null, spinning: false }),
}))
