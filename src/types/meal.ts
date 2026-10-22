import type { DishProtein, KitchenLocation, MealOut } from "@/types/database"

export type RecentMeal = {
  id: string
  eatenOn: string            // YYYY-MM-DD
  dishId: string | null      // null: eaten out without naming a dish of mine
  dishName: string           // the dish, else what we ate out, else "" (the UI names the outing)
  eatenOut: MealOut | null   // null = cooked at home
  place: string | null       // where, when eaten out
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
  dishLabel: string | null   // what we ate out, written freely
}

// What goals need to know about a dinner
export type CountedMeal = {
  dishId: string | null
  eatenOn: string
  proteins: DishProtein[]
  traits: string[]
  diners: string[]
}

// dishId of an existing dish, or newDishName to create one on the fly. Eaten out (eatenOut set),
// the dish is optional and the place can be written down instead.
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
  eatenOut: MealOut | null
  place: string | null
  dishLabel: string | null     // eaten out: what we ate, written freely (no dish is created)
  photo?: Blob | null          // a new photo of the dinner, picked in the form
}

// What I wrote about a dish the times we ate it (dish page)
export type DishNote = { id: string; eatenOn: string; rating: number | null; note: string | null }

// The last dinner still waiting for its stars (home page)
export type UnratedMeal = { id: string; eatenOn: string; dishName: string; imageUrl: string | null; eatenOut: MealOut | null }

// A dinner as the monthly recap needs it
export type RecapMeal = {
  dishId: string | null
  dishName: string
  imageUrl: string | null
  eatenOn: string
  rating: number | null
  protein: string | null    // the main one, for the plate strip
  proteins: string[]
  traits: string[]
  eatenOut: MealOut | null
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
