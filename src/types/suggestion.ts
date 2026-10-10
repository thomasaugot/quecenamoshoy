import type { KitchenLocation } from "@/types/database"

export type TempWish = "hot" | "cold" | "any"
export type SuggestStatus = "idle" | "loading" | "error" | "done"
export type WizardStep = "location" | "temp" | "leftovers" | "fridge" | "diners" | "results"

// What the wizard asked, and what I answered
export type WizardAnswers = {
  location: KitchenLocation | null
  temp: TempWish | null
  leftovers: boolean | null
  diners: string[]
  guests: number
  guestRestrictions: string[]    // allergen / diet catalogue keys, tonight only
  note: string                   // free words for tonight ("il reste des courgettes"), may be empty
  ingredients: string[]          // things in the fridge to use up, may be empty
}

// One idea from the suggest Edge Function (brief §4.3)
export type Suggestion = {
  dishId: string | null
  name: string
  description: string
  temp: "hot" | "cold"
  prepMinutes: number
  goodForLeftovers: boolean
  tags: string[]
  equipment: string[]
  isFavourite: boolean
  reason: string
}

// Location and diners are remembered for the day (brief §3.2), so the roulette doesn't re-ask
export type TodayAnswers = { date: string; location: KitchenLocation; diners: string[]; guests: number }
