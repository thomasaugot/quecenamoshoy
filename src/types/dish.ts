import type { DishProtein, DishTemp } from "@/types/database"

export type Dish = {
  id: string
  name: string
  description: string | null
  proteins: DishProtein[]    // what it is made of: chicken AND chorizo
  tags: string[]             // my own words for it ("chorizo", "de la abuela")
  traits: string[]
  temp: DishTemp | null
  imageUrl: string | null    // short-lived signed URL (private bucket)
  lovedBy: string[]          // person ids
  dislikedBy: string[]       // person ids: left out of the roulette and suggestions when at the table
  equipment: string[]        // catalogue keys it needs (brief §3.6)
  notes: string | null       // my standing note on the dish, read before cooking
}

export type DishInput = {
  name: string
  description: string | null
  proteins: DishProtein[]
  traits: string[]
  tags: string[]
  temp: DishTemp | null
  lovedBy: string[]
  dislikedBy: string[]
}

export type Taste = "love" | "dislike"

// Within a group any choice matches; across groups every group must match
export type DishFilter = {
  query: string
  personId: string | null
  proteins: DishProtein[]
  traits: string[]
  temps: DishTemp[]
}

// One entry of the "what's in it" field: a catalogue word the app understands, or my own
export type TagOption = { kind: "protein" | "trait" | "custom"; key: string; label: string }
