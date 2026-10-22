import { create } from "zustand"
import type { DishProtein, DishTemp } from "@/types/database"
import type { DishFilter } from "@/types/dish"
import { toggleId } from "@/utils/people"

// UI state of the favourites page: the filter, and which dish the editor is open on
// ("new" = adding one). Server data stays in TanStack Query.
type FavouritesState = DishFilter & {
  filtersOpen: boolean
  editing: string | "new" | null
  importing: boolean
  setQuery: (query: string) => void
  setPersonId: (personId: string | null) => void
  toggleProtein: (protein: DishProtein) => void
  toggleTrait: (trait: string) => void
  toggleTemp: (temp: DishTemp) => void
  clearFilters: () => void
  setFiltersOpen: (open: boolean) => void
  openEditor: (dishId: string | "new") => void
  closeEditor: () => void
  setImporting: (importing: boolean) => void
}

export const useFavouritesStore = create<FavouritesState>()((set) => ({
  query: "",
  personId: null,
  proteins: [],
  traits: [],
  temps: [],
  filtersOpen: false,
  editing: null,
  importing: false,
  setQuery: (query) => set({ query }),
  setPersonId: (personId) => set({ personId }),
  toggleProtein: (protein) => set((s) => ({ proteins: toggleId(s.proteins, protein) })),
  toggleTrait: (trait) => set((s) => ({ traits: toggleId(s.traits, trait) })),
  toggleTemp: (temp) => set((s) => ({ temps: toggleId(s.temps, temp) })),
  clearFilters: () => set({ proteins: [], traits: [], temps: [] }),
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  openEditor: (editing) => set({ editing }),
  closeEditor: () => set({ editing: null }),
  setImporting: (importing) => set({ importing }),
}))
