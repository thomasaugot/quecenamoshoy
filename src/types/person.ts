import type { DishProtein, RestrictionKind } from "@/types/database"

export type Me = { id: string; name: string } | null

// label: null for catalogue entries (translated), the typed text for my own ones
export type Restriction = { kind: RestrictionKind; key: string; label: string | null }
export type Goal = { key: string; perWeek: number }

// A person I cook for, with what they can't / won't eat and the goals they're nudged toward
export type Person = {
  id: string
  name: string
  isMe: boolean
  restrictions: Restriction[]
  goals: Goal[]
}

export type AppSettings = { avoidDays: number; defaultDiners: string[] }

export type GoalKind = "limit" | "min"
// counts: which dishes a goal counts — by protein and/or trait (either matches);
// weekdaysOnly: only Monday–Friday dinners count (light_weekdays)
export type GoalCounts = { proteins?: readonly DishProtein[]; traits?: readonly string[]; weekdaysOnly?: boolean }
export type GoalDefinition = { key: string; kind: GoalKind; defaultPerWeek: number; counts: GoalCounts }
export type GoalProgress = { key: string; kind: GoalKind; count: number; target: number; met: boolean }
