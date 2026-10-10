import { PERSON_NAME_MAX } from "@/constants/settings"
import type { RestrictionKind } from "@/types/database"
import type { Goal, Person, Restriction } from "@/types/person"

export const restrictionKeys = (person: Person, kind: RestrictionKind): string[] =>
  person.restrictions.filter((r) => r.kind === kind).map((r) => r.key)

// The ones I typed myself (not in the catalogue), in the order they were added
export const customRestrictions = (person: Person, kind: RestrictionKind): Restriction[] =>
  person.restrictions.filter((r) => r.kind === kind && r.label !== null)

export const normaliseText = (text: string) =>
  text.trim().toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ")

// A typed restriction's key: c_ + a slug that fits the DB check ^[a-z0-9_]{1,40}$.
// Same text → same key, so typing "Piñones" twice cannot create two rows.
export const customKey = (label: string) =>
  `c_${normaliseText(label).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 38) || "x"}`

export const findGoal = (person: Person, key: string): Goal | undefined =>
  person.goals.find((g) => g.key === key)

// Default diners can outlive a deleted person: keep only ids that still exist.
export const existingDiners = (ids: readonly string[], people: readonly Person[]): string[] =>
  ids.filter((id) => people.some((p) => p.id === id))

export const toggleId = (ids: readonly string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]

export const initialOf = (name: string) => name.trim().charAt(0).toLocaleUpperCase()

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Mirrors the CHECK on people.name (1–60 characters). Returns the locale key of the problem.
export const personNameError = (name: string): "required" | "tooLong" | null => {
  const trimmed = name.trim()
  if (!trimmed) return "required"
  if (trimmed.length > PERSON_NAME_MAX) return "tooLong"
  return null
}

// Typed text that is really a catalogue entry ("ajo" → garlic) switches that entry on instead
export const matchCatalogue = (text: string, entries: readonly { key: string; label: string }[]): string | null =>
  entries.find((e) => normaliseText(e.label) === normaliseText(text))?.key ?? null
