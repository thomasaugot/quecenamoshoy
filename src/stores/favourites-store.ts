import { create } from "zustand"
import type { DishFilter } from "@/types/dish"

// UI state of the favourites page: the filter, and which dish the editor is open on
// ("new" = adding one). Server data stays in TanStack Query.
type FavouritesState = DishFilter & {
  editing: string | "new" | null
  importing: boolean
  setQuery: (query: string) => void
  setPersonId: (personId: string | null) => void
  openEditor: (dishId: string | "new") => void
  closeEditor: () => void
  setImporting: (importing: boolean) => void
}

export const useFavouritesStore = create<FavouritesState>()((set) => ({
  query: "",
  personId: null,
  editing: null,
  importing: false,
  setQuery: (query) => set({ query }),
  setPersonId: (personId) => set({ personId }),
  openEditor: (editing) => set({ editing }),
  closeEditor: () => set({ editing: null }),
  setImporting: (importing) => set({ importing }),
}))
