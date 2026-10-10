import { create } from "zustand"
import type { Suggestion, SuggestStatus, WizardAnswers, WizardStep } from "@/types/suggestion"

const EMPTY: WizardAnswers = { location: null, temp: null, leftovers: null, diners: [], guests: 0, guestRestrictions: [] }

// The wizard's UI state. Suggestions are the result of a one-off mutation, not cached server
// data, so they live here with the names already shown (sent as `exclude` on Regenerate).
type WizardState = {
  step: WizardStep
  answers: WizardAnswers
  suggestions: Suggestion[]
  status: SuggestStatus              // one request at a time, seen by every component
  shown: string[]
  saved: Record<string, string>        // suggestion name → dish id created by "add to favourites"
  answer: (patch: Partial<WizardAnswers>, next: WizardStep) => void
  goTo: (step: WizardStep) => void
  setSuggestions: (suggestions: Suggestion[]) => void
  setStatus: (status: SuggestStatus) => void
  markSaved: (name: string, dishId: string) => void
  start: (answers: Partial<WizardAnswers>) => void
}

export const useWizardStore = create<WizardState>()((set) => ({
  step: "location",
  answers: EMPTY,
  suggestions: [],
  status: "idle",
  shown: [],
  saved: {},
  answer: (patch, next) => set((s) => ({ answers: { ...s.answers, ...patch }, step: next })),
  goTo: (step) => set({ step }),
  setSuggestions: (suggestions) => set((s) => ({ suggestions, status: "done", shown: [...s.shown, ...suggestions.map((x) => x.name)] })),
  setStatus: (status) => set({ status }),
  markSaved: (name, dishId) => set((s) => ({ saved: { ...s.saved, [name]: dishId } })),
  start: (answers) => set({ step: "location", answers: { ...EMPTY, ...answers }, suggestions: [], status: "idle", shown: [], saved: {} }),
}))
