import type { Dish } from "@/types/dish"

export type RoulettePreference = { chips: string[]; text: string }

// A dish on the wheel: its weight decides how likely it is to make the wheel and to win
export type WheelSlot = { dish: Dish; weight: number; matches: boolean }

export type WheelSegment = { start: number; end: number }   // degrees, 0 = top, clockwise
