import type { DishProtein, DishTemp } from "@/types/database"

export type Dish = {
  id: string
  name: string
  description: string | null
  protein: DishProtein | null
  traits: string[]
  temp: DishTemp | null
  imageUrl: string | null    // short-lived signed URL (private bucket)
  lovedBy: string[]          // person ids
  equipment: string[]        // catalogue keys it needs (brief §3.6)
  notes: string | null       // my standing note on the dish, read before cooking
}

export type DishInput = {
  name: string
  description: string | null
  protein: DishProtein | null
  traits: string[]
  temp: DishTemp | null
  lovedBy: string[]
}

export type DishFilter = { query: string; personId: string | null }
