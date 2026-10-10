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

// What I wrote about a dish the times we ate it (dish page)
export type DishNote = { id: string; eatenOn: string; rating: number | null; note: string | null }

// The last dinner still waiting for its stars (home page)
export type UnratedMeal = { id: string; eatenOn: string; dishName: string; imageUrl: string | null }

// A dinner as the monthly recap needs it
export type RecapMeal = {
  dishId: string
  dishName: string
  imageUrl: string | null
  eatenOn: string
  rating: number | null
  protein: string | null
  isNew: boolean            // first time this dish was ever logged
}

export type RecapDish = { dishId: string; name: string; imageUrl: string | null; count: number }

export type MonthRecap = {
  dinners: number
  dishes: number
  newDishes: string[]
  top: RecapDish[]
  best: RecapMeal | null
  proteins: { key: string; count: number }[]
  averageRating: number | null
}

export type MealMonth = { month: string; meals: Meal[] }   // month = YYYY-MM
