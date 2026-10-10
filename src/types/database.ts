// HAND-WRITTEN from supabase/migrations/20261010000000_initial_schema.sql until the local stack
// exists. Then replace the whole file with: npx supabase gen types typescript --local
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type DishTemp = "hot" | "cold"
export type DishSource = "mine" | "ai"

export type Database = {
  public: {
    Tables: {
      dishes: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          temp: DishTemp | null
          tags: string[]
          is_favourite: boolean
          source: DishSource
          image_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          description?: string | null
          temp?: DishTemp | null
          tags?: string[]
          is_favourite?: boolean
          source?: DishSource
          image_path?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["dishes"]["Insert"]>
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          dish_id: string
          servings: number
          prep_minutes: number | null
          good_for_leftovers: boolean
          ingredients: Json
          steps: Json
          updated_at: string
        }
        Insert: {
          id?: string
          dish_id: string
          servings: number
          prep_minutes?: number | null
          good_for_leftovers?: boolean
          ingredients: Json
          steps: Json
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>
        Relationships: [
          { foreignKeyName: "recipes_dish_id_fkey"; columns: ["dish_id"]; isOneToOne: true; referencedRelation: "dishes"; referencedColumns: ["id"] },
        ]
      }
      meals: {
        Row: {
          id: string
          user_id: string
          dish_id: string
          eaten_on: string
          people: number
          with_leftovers: boolean
          rating: number | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          dish_id: string
          eaten_on?: string
          people?: number
          with_leftovers?: boolean
          rating?: number | null
          note?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["meals"]["Insert"]>
        Relationships: [
          { foreignKeyName: "meals_dish_id_fkey"; columns: ["dish_id"]; isOneToOne: false; referencedRelation: "dishes"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { dish_temp: DishTemp; dish_source: DishSource }
    CompositeTypes: { [_ in never]: never }
  }
}
