import type { DishProtein, KitchenLocation } from "@/types/database"

export type RecentMeal = {
  id: string
  eatenOn: string            // YYYY-MM-DD
  dishId: string
  dishName: string
  imageUrl: string | null    // short-lived signed URL (private bucket)
}

// One dinner in the history
export type Meal = RecentMeal & {
  rating: number | null
  note: string | null
  guests: number
  location: KitchenLocation
  withLeftovers: boolean
  diners: string[]           // person ids
}

// What goals need to know about a dinner
export type CountedMeal = {
  dishId: string
  eatenOn: string
  protein: DishProtein | null
  traits: string[]
  diners: string[]
}

// dishId of an existing dish, or newDishName to create one on the fly
export type MealInput = {
  dishId: string | null
  newDishName: string | null
  eatenOn: string
  diners: string[]
  guests: number
  location: KitchenLocation
  rating: number | null
  note: string | null
  withLeftovers: boolean
}

export type MealMonth = { month: string; meals: Meal[] }   // month = YYYY-MM
