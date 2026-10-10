import { supabase } from "@/lib/supabase"
import { signedImageUrls } from "@/services/storage"
import type { RestrictionKind } from "@/types/database"
import type { Me, Person } from "@/types/person"

// My own profile (is_me). Null until onboarding creates it.
export const getMe = async (): Promise<Me> => {
  const { data, error } = await supabase.from("people").select("id, name").eq("is_me", true).maybeSingle()
  if (error) throw new Error(`me query failed: ${error.code}`)
  return data
}

// Me first, then the others in the order I added them.
export const listPeople = async (): Promise<Person[]> => {
  const { data, error } = await supabase
    .from("people")
    .select("id, name, is_me, avatar_path, person_restrictions(kind, key, label), person_goals(key, per_week)")
    .order("is_me", { ascending: false })
    .order("created_at", { ascending: true })
  if (error) throw new Error(`people query failed: ${error.code}`)
  const urls = await signedImageUrls(data.flatMap((p) => (p.avatar_path ? [p.avatar_path] : [])))
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    isMe: p.is_me,
    avatarUrl: p.avatar_path ? urls.get(p.avatar_path) ?? null : null,
    restrictions: p.person_restrictions,
    goals: p.person_goals.map((g) => ({ key: g.key, perWeek: g.per_week })),
  }))
}

export const createPerson = async ({ name, isMe }: { name: string; isMe: boolean }): Promise<void> => {
  const { error } = await supabase.from("people").insert({ name, is_me: isMe })
  if (error) throw new Error(`create person failed: ${error.code}`)
}

export const renamePerson = async ({ id, name }: { id: string; name: string }): Promise<void> => {
  const { error } = await supabase.from("people").update({ name }).eq("id", id)
  if (error) throw new Error(`rename person failed: ${error.code}`)
}

// Never me: the UI offers no delete for is_me, and the filter makes sure of it.
export const deletePerson = async (id: string): Promise<void> => {
  const { error } = await supabase.from("people").delete().eq("id", id).eq("is_me", false)
  if (error) throw new Error(`delete person failed: ${error.code}`)
}

type RestrictionInput = { personId: string; kind: RestrictionKind; key: string; label?: string | null }

export const setRestriction = async ({ personId, kind, key, label = null, on }: RestrictionInput & { on: boolean }): Promise<void> => {
  const { error } = on
    ? await supabase.from("person_restrictions")
        .upsert({ person_id: personId, kind, key, label }, { onConflict: "person_id,kind,key", ignoreDuplicates: true })
    : await supabase.from("person_restrictions").delete().match({ person_id: personId, kind, key })
  if (error) throw new Error(`restriction write failed: ${error.code}`)
}

// perWeek null = goal off (row removed)
export const setGoal = async ({ personId, key, perWeek }: { personId: string; key: string; perWeek: number | null }): Promise<void> => {
  const { error } = perWeek === null
    ? await supabase.from("person_goals").delete().match({ person_id: personId, key })
    : await supabase.from("person_goals")
        .upsert({ person_id: personId, key, per_week: perWeek }, { onConflict: "person_id,key" })
  if (error) throw new Error(`goal write failed: ${error.code}`)
}
