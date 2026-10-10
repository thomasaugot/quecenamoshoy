// HAND-WRITTEN from supabase/schema.sql. Regenerate from the live project once the CLI is linked:
// npx supabase gen types typescript --project-id <ref> > src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type DishTemp = "hot" | "cold"
export type DishSource = "mine" | "ai"
export type KitchenLocation = "home" | "travel"
export type RecipeSource = "mine" | "ai" | "imported"
export type RestrictionKind = "allergy" | "dislike" | "diet"
export type DishProtein = "red_meat" | "pork" | "poultry" | "fish" | "seafood" | "eggs" | "vegetarian" | "vegan"

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
          image_credit: string | null
          equipment: string[]
          protein: DishProtein | null
          traits: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          image_credit?: string | null
          equipment?: string[]
          protein?: DishProtein | null
          traits?: string[]
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
          equipment: string[]
          source: RecipeSource
          source_url: string | null
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
          equipment?: string[]
          source?: RecipeSource
          source_url?: string | null
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
          location: KitchenLocation
          guests: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          dish_id: string
          location?: KitchenLocation
          guests?: number
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
      people: {
        Row: { id: string; user_id: string; name: string; is_me: boolean; created_at: string }
        Insert: { id?: string; user_id?: string; name: string; is_me?: boolean; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>
        Relationships: []
      }
      person_restrictions: {
        Row: { id: string; person_id: string; kind: RestrictionKind; key: string; label: string | null }
        Insert: { id?: string; person_id: string; kind: RestrictionKind; key: string; label?: string | null }
        Update: Partial<Database["public"]["Tables"]["person_restrictions"]["Insert"]>
        Relationships: [
          { foreignKeyName: "person_restrictions_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "people"; referencedColumns: ["id"] },
        ]
      }
      person_goals: {
        Row: { id: string; person_id: string; key: string; per_week: number }
        Insert: { id?: string; person_id: string; key: string; per_week: number }
        Update: Partial<Database["public"]["Tables"]["person_goals"]["Insert"]>
        Relationships: [
          { foreignKeyName: "person_goals_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "people"; referencedColumns: ["id"] },
        ]
      }
      dish_favourites: {
        Row: { person_id: string; dish_id: string }
        Insert: { person_id: string; dish_id: string }
        Update: Partial<Database["public"]["Tables"]["dish_favourites"]["Insert"]>
        Relationships: [
          { foreignKeyName: "dish_favourites_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "people"; referencedColumns: ["id"] },
          { foreignKeyName: "dish_favourites_dish_id_fkey"; columns: ["dish_id"]; isOneToOne: false; referencedRelation: "dishes"; referencedColumns: ["id"] },
        ]
      }
      meal_diners: {
        Row: { meal_id: string; person_id: string }
        Insert: { meal_id: string; person_id: string }
        Update: Partial<Database["public"]["Tables"]["meal_diners"]["Insert"]>
        Relationships: [
          { foreignKeyName: "meal_diners_meal_id_fkey"; columns: ["meal_id"]; isOneToOne: false; referencedRelation: "meals"; referencedColumns: ["id"] },
          { foreignKeyName: "meal_diners_person_id_fkey"; columns: ["person_id"]; isOneToOne: false; referencedRelation: "people"; referencedColumns: ["id"] },
        ]
      }
      kitchen_items: {
        Row: { id: string; user_id: string; location: KitchenLocation; key: string; category: "appliance" | "cookware" | "tool"; source: DishSource; label: string | null; created_at: string }
        Insert: { id?: string; user_id?: string; location?: KitchenLocation; key: string; category: "appliance" | "cookware" | "tool"; source?: DishSource; label?: string | null; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["kitchen_items"]["Insert"]>
        Relationships: []
      }
      settings: {
        Row: { user_id: string; avoid_days: number; default_diners: string[] }
        Insert: { user_id?: string; avoid_days?: number; default_diners?: string[] }
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { dish_temp: DishTemp; dish_source: DishSource; kitchen_location: KitchenLocation; dish_protein: DishProtein; restriction_kind: RestrictionKind }
    CompositeTypes: { [_ in never]: never }
  }
}
