import { DIET_EXCLUDED_PROTEINS } from "@/constants/diets"
import { EQUIPMENT } from "@/constants/equipment"
import { GOALS } from "@/constants/goals"
import {
  GOAL_BEHIND_BOOST, GOAL_OVER_DAMP, LOVED_BY_BONUS, PREFERENCE_BOOST, PREFERENCE_CHIPS, PREFERENCE_DAMP,
  PREFERENCE_STOPWORDS, UNKNOWN_PROTEIN_DAMP, WHEEL_MAX, WHEEL_MIN, type PreferenceChip,
} from "@/constants/roulette"
import type { Dish } from "@/types/dish"
import type { KitchenItem } from "@/types/kitchen"
import type { CountedMeal } from "@/types/meal"
import type { Person } from "@/types/person"
import type { RoulettePreference, WheelSlot } from "@/types/roulette"
import { findAllergens } from "@/utils/allergens"
import { countsToward, goalProgress } from "@/utils/goals"
import { normaliseText } from "@/utils/people"

const CATALOGUE_EQUIPMENT = new Set<string>(Object.values(EQUIPMENT).flat())

export type RouletteContext = {
  dishes: readonly Dish[]
  diners: readonly Person[]
  guestRestrictions: readonly string[]     // allergen + diet keys, tonight only
  recentMeals: readonly CountedMeal[]      // this week (goals) — includes the avoid window
  avoidSinceIso: string
  todayIso: string
  kitchen: readonly KitchenItem[] | null   // null = not filled in: don't filter by equipment
  preference: RoulettePreference
}

const STOPWORDS = new Set(PREFERENCE_STOPWORDS)

export const words = (text: string) =>
  normaliseText(text).split(/[^\p{L}]+/u).filter((w) => w.length >= 3 && !STOPWORDS.has(w))

// At most one letter added, removed or changed ("spates" ~ "pates", "lasana" ~ "lasagna")
const oneEditApart = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

// A wanted word matches a word of the dish exactly, as a stem ("gratin" ~ "gratinado"), or
// with one typo for words of 5+ letters
export const wordMatches = (dishWord: string, wanted: string) =>
  dishWord === wanted ||
  (wanted.length >= 4 && (dishWord.startsWith(wanted) || (dishWord.length >= 4 && wanted.startsWith(dishWord)))) ||
  (wanted.length >= 5 && oneEditApart(dishWord, wanted))

const dishWords = (d: Dish) => words(`${d.name} ${d.description ?? ""}`)

const matchesChip = (d: Dish, chip: PreferenceChip) =>
  d.proteins.some((x) => chip.proteins?.includes(x)) ||
  d.traits.some((t) => chip.traits?.includes(t)) ||
  !!chip.words?.some((w) => dishWords(d).some((dw) => wordMatches(dw, w)))

const matchesText = (d: Dish, text: string) =>
  words(text).some((w) => dishWords(d).some((dw) => wordMatches(dw, w)))

// A typed word that names a quick chip switches that chip on too: "pâtes" (or "spates") brings
// in lasagne and tagliatelle, not only dishes with the word "pâtes" in their name.
const chipsNamedIn = (text: string) =>
  PREFERENCE_CHIPS.filter((c) => !("avoid" in c) && words(text).some((w) => c.words?.some((cw) => wordMatches(cw, w))))

// Hard rules first (same as the suggestions): who can eat it, when we last had it, the kitchen.
export const eligibleDishes = (ctx: RouletteContext): Dish[] => {
  const dinerIds = ctx.diners.map((p) => p.id)
  const loved = ctx.dishes.filter((d) => d.lovedBy.some((id) => dinerIds.includes(id)))
  const pool = loved.length ? loved : ctx.dishes
  const eatenLately = new Set(ctx.recentMeals.filter((m) => m.eatenOn >= ctx.avoidSinceIso).map((m) => m.dishId))
  const allergies = [
    ...ctx.diners.flatMap((p) => p.restrictions.filter((r) => r.kind === "allergy")),
    ...ctx.guestRestrictions.map((key) => ({ key, label: null })),
  ]
  const diets = [...ctx.diners.flatMap((p) => p.restrictions.filter((r) => r.kind === "diet").map((r) => r.key)), ...ctx.guestRestrictions]
  const excludedProteins = new Set(diets.flatMap((d) => DIET_EXCLUDED_PROTEINS[d] ?? []))
  const owned = ctx.kitchen ? new Set(ctx.kitchen.map((k) => k.key)) : null

  return pool.filter((d) =>
    !eatenLately.has(d.id) &&
    findAllergens([d.name, d.description ?? ""], allergies).length === 0 &&
    !d.proteins.some((x) => excludedProteins.has(x)) &&
    !(owned && d.equipment.some((e) => CATALOGUE_EQUIPMENT.has(e) && !owned.has(e))))
}

// Soft rules: tonight's preference, who loves it, eating goals behind or already met.
export const weighDish = (d: Dish, ctx: RouletteContext): WheelSlot => {
  const chips = [...PREFERENCE_CHIPS.filter((c) => ctx.preference.chips.includes(c.key)), ...chipsNamedIn(ctx.preference.text)]
  const wants = chips.filter((c) => !("avoid" in c)).some((c) => matchesChip(d, c)) || (!!ctx.preference.text.trim() && matchesText(d, ctx.preference.text))
  const avoids = chips.filter((c) => "avoid" in c).some((c) => matchesChip(d, c))
  const dinerIds = ctx.diners.map((p) => p.id)
  const hasDiet = ctx.diners.some((p) => p.restrictions.some((r) => r.kind === "diet")) || ctx.guestRestrictions.length > 0

  let weight = 1 + LOVED_BY_BONUS * d.lovedBy.filter((id) => dinerIds.includes(id)).length
  if (wants) weight *= PREFERENCE_BOOST
  if (avoids) weight *= PREFERENCE_DAMP
  if (hasDiet && d.proteins.length === 0) weight *= UNKNOWN_PROTEIN_DAMP
  const asMeal: CountedMeal = { dishId: d.id, eatenOn: ctx.todayIso, proteins: d.proteins, traits: d.traits, diners: dinerIds }
  for (const person of ctx.diners) {
    for (const g of goalProgress(person, ctx.recentMeals)) {
      const def = GOALS.find((x) => x.key === g.key)
      if (!def || !countsToward(asMeal, def.counts)) continue
      if (g.kind === "min" && !g.met) weight *= GOAL_BEHIND_BOOST
      if (g.kind === "limit" && g.count >= g.target) weight *= GOAL_OVER_DAMP
    }
  }
  return { dish: d, weight, matches: wants, avoided: avoids }
}

// `random` in [0, 1): Math.random in the app, fixed values in tests
export const pickWeighted = <T extends { weight: number }>(items: readonly T[], random: () => number): number => {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = random() * total
  const index = items.findIndex((i) => (r -= i.weight) < 0)
  return index === -1 ? items.length - 1 : index
}

const draw = (pool: WheelSlot[], count: number, random: () => number): WheelSlot[] => {
  const left = [...pool]
  const out: WheelSlot[] = []
  while (left.length && out.length < count) out.push(...left.splice(pickWeighted(left, random), 1))
  return out
}

// The wheel. A preference DECIDES: what I said I don't want is off the wheel, and when something
// matches what I want, only matches go on it — repeated to fill the wheel if there are few, so
// "pescado" with one fish dish lands on that fish, every time. Nothing matching: every eligible
// dish (the spin says so). No preference: WHEEL_MAX drawn by weight. Shuffled.
export const buildWheel = (ctx: RouletteContext, random: () => number): WheelSlot[] => {
  const slots = eligibleDishes(ctx).map((d) => weighDish(d, ctx))
  const allowed = slots.filter((s) => !s.avoided)
  const pool = allowed.length ? allowed : slots
  const matching = pool.filter((s) => s.matches)
  const wheel = matching.length ? fillWheel(draw(matching, WHEEL_MAX, random)) : draw(pool, WHEEL_MAX, random)
  return shuffle(wheel, random)
}

// Few matches still make a full wheel: the same dishes again, in turn, up to WHEEL_MIN slices
const fillWheel = (slots: WheelSlot[]): WheelSlot[] => {
  const out = [...slots]
  for (let i = 0; out.length < WHEEL_MIN && slots.length; i++) out.push(slots[i % slots.length] as WheelSlot)
  return out
}

const shuffle = <T,>(items: readonly T[], random: () => number): T[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

// Something I WANT tonight (not only something I don't): what "nothing matches" is about
export const wantsSomething = (p: RoulettePreference) =>
  words(p.text).length > 0 || PREFERENCE_CHIPS.some((c) => !("avoid" in c) && p.chips.includes(c.key))
