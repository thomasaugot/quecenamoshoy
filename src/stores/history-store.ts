import { create } from "zustand"

// Which meal the log form is open on ("new" = logging one)
type HistoryState = {
  editing: string | "new" | null
  openEditor: (mealId: string | "new") => void
  closeEditor: () => void
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  editing: null,
  openEditor: (editing) => set({ editing }),
  closeEditor: () => set({ editing: null }),
}))
