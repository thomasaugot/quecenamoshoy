import type { SupabaseClient } from "@supabase/supabase-js"

// Everything the model needs to know about tonight, read with the CALLER's client: row-level
// security decides what exists. Ids the caller sends that aren't theirs simply match nothing.

export type Location = "home" | "travel"

type Restriction = { kind: "allergy" | "dislike" | "diet"; key: string; label: string | null }
export type Diner = { id: string; name: string; restrictions: Restriction[]; goals: { key: string; perWeek: number }[] }
export type FavouriteDish = { id: string; name: string; temp: string | null; tags: string[]; traits: string[]; proteins: string[]; equipment: string[]; lovedBy: number }
export type RecentMeal = { eatenOn: string; rating: number | null; dishId: string; name: string; proteins: string[]; traits: string[] }
export type Context = {
  diners: Diner[]
  favourites: FavouriteDish[]
  equipment: { key: string; label: string | null }[]
  kitchenKnown: boolean          // false = nothing ticked yet: don't filter by equipment
  avoidDays: number
  recentMeals: RecentMeal[]
  lovedDishes: string[]
  dislikedHere: { id: string; name: string }[]   // someone at the table dislikes it: never tonight
  chanceTonight: string[]                         // only people away tonight dislike it: a rare chance
}

// Brief §3.2: a travelling kitchen nobody has filled in yet is assumed minimal
const MINIMAL_TRAVEL_KITCHEN = ["hob", "frying_pan", "saucepan", "chef_knife"]
const NO_MATCH = "00000000-0000-0000-0000-000000000000"

export const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

// Untyped client: an embedded relation can arrive as an object or a one-item array
const one = <T>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? value[0] ?? null : value ?? null)

type DishRow = { id: string; name: string; temp: string | null; tags: string[]; traits: string[]; proteins: string[]; equipment: string[] }

export const loadContext = async (client: SupabaseClient, location: Location, dinerIds: string[]): Promise<Context> => {
  const ids = dinerIds.length ? dinerIds : [NO_MATCH]
  const [people, favourites, kitchen, settings, recent, rated, dislikes] = await Promise.all([
    client.from("people").select("id, name, person_restrictions(kind, key, label), person_goals(key, per_week)").in("id", ids),
    client.from("dish_favourites").select("person_id, dishes(id, name, temp, tags, traits, proteins, equipment)").in("person_id", ids),
    client.from("kitchen_items").select("key, label").eq("location", location),
    client.from("settings").select("avoid_days").maybeSingle(),
    client.from("meals").select("eaten_on, rating, dish_id, dishes(name, proteins, traits)").gte("eaten_on", daysAgoIso(14)).order("eaten_on", { ascending: false }),
    client.from("meals").select("dishes(name)").gte("rating", 4).order("eaten_on", { ascending: false }).limit(15),
    client.from("dish_dislikes").select("person_id, dishes(id, name)"),
  ])
  for (const r of [people, favourites, kitchen, settings, recent, rated, dislikes]) {
    if (r.error) throw new Error(`context query failed: ${r.error.code}`)
  }

  const diners: Diner[] = (people.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    restrictions: p.person_restrictions ?? [],
    goals: (p.person_goals ?? []).map((g: { key: string; per_week: number }) => ({ key: g.key, perWeek: g.per_week })),
  }))

  const byDish = new Map<string, FavouriteDish>()
  for (const f of favourites.data ?? []) {
    const d = one<DishRow>(f.dishes)
    if (!d) continue
    const prev = byDish.get(d.id)
    byDish.set(d.id, { ...d, lovedBy: (prev?.lovedBy ?? 0) + 1 })
  }

  const recentMeals: RecentMeal[] = (recent.data ?? []).flatMap((m) => {
    const d = one<{ name: string; proteins: string[]; traits: string[] }>(m.dishes)
    return d ? [{ eatenOn: m.eaten_on, rating: m.rating, dishId: m.dish_id, name: d.name, proteins: d.proteins, traits: d.traits }] : []
  })

  // Dislikes of everyone (RLS: my people): at the table → out; only the absent → a chance
  const atTable = new Set(dinerIds)
  const here = new Map<string, string>()
  const away = new Map<string, string>()
  for (const r of dislikes.data ?? []) {
    const d = one<{ id: string; name: string }>(r.dishes)
    if (d) (atTable.has(r.person_id) ? here : away).set(d.id, d.name)
  }
  for (const id of [...byDish.keys()]) if (here.has(id)) byDish.delete(id)

  const owned = kitchen.data ?? []
  return {
    diners,
    favourites: [...byDish.values()],
    // Travel with nothing listed = the brief's minimal kitchen. Home with nothing listed = not
    // filled in yet: assume an ordinary kitchen rather than "owns nothing" (which rejects every dish).
    equipment: location === "travel" && owned.length === 0 ? MINIMAL_TRAVEL_KITCHEN.map((key) => ({ key, label: null })) : owned,
    kitchenKnown: location === "travel" || owned.length > 0,
    avoidDays: settings.data?.avoid_days ?? 7,
    recentMeals,
    dislikedHere: [...here].map(([id, name]) => ({ id, name })),
    chanceTonight: [...away].filter(([id]) => !here.has(id)).map(([, name]) => name),
    lovedDishes: [...new Set((rated.data ?? []).flatMap((m) => { const d = one<{ name: string }>(m.dishes); return d ? [d.name] : [] }))],
  }
}
