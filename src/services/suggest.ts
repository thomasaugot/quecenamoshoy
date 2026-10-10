import { FunctionsHttpError } from "@supabase/supabase-js"
import type { Locale } from "@/config/i18n.config"
import { supabase } from "@/lib/supabase"
import { createMeal } from "@/services/meals"
import type { Suggestion, WizardAnswers } from "@/types/suggestion"
import { functionErrorCode, RateLimitedError } from "@/utils/errors"

type SuggestRequest = { answers: WizardAnswers; exclude: string[]; language: Locale }

// Three ideas from Gemini (Edge Function suggest). The function re-checks the hard rules.
export const getSuggestions = async ({ answers, exclude, language }: SuggestRequest): Promise<Suggestion[]> => {
  const { data, error } = await supabase.functions.invoke<{ suggestions: Suggestion[] }>("suggest", {
    body: {
      location: answers.location ?? "home",
      diners: answers.diners,
      guests: answers.guests,
      guestRestrictions: answers.guestRestrictions,
      temp: answers.temp ?? "any",
      leftovers: answers.leftovers ?? false,
      exclude,
      language,
    },
  })
  if (error instanceof FunctionsHttpError && error.context.status === 429) throw new RateLimitedError("suggest")
  if (error || !data) throw new Error(`suggest failed: ${await functionErrorCode(error)}`)
  return data.suggestions
}

// A new AI idea becomes a real dish (source 'ai') the first time I keep it or eat it
export const createDishFromSuggestion = async (s: Suggestion): Promise<string> => {
  const { data, error } = await supabase.from("dishes")
    .insert({ name: s.name, description: s.description, temp: s.temp, tags: s.tags, equipment: s.equipment, source: "ai" })
    .select("id").single()
  if (error) throw new Error(`create dish failed: ${error.code}`)
  return data.id
}

export const saveSuggestion = async ({ suggestion, lovedBy }: { suggestion: Suggestion; lovedBy: string[] }): Promise<string> => {
  const dishId = await createDishFromSuggestion(suggestion)
  if (lovedBy.length) {
    const { error } = await supabase.from("dish_favourites").insert(lovedBy.map((personId) => ({ person_id: personId, dish_id: dishId })))
    if (error) throw new Error(`favourite write failed: ${error.code}`)
  }
  return dishId
}

// "Cenamos esto": tonight's meal, with who is at the table (brief §6)
export const acceptSuggestion = async ({ suggestion, dishId, answers, todayIso }: {
  suggestion: Suggestion
  dishId: string | null
  answers: WizardAnswers
  todayIso: string
}): Promise<void> => {
  const id = dishId ?? suggestion.dishId ?? (await createDishFromSuggestion(suggestion))
  await createMeal({
    dishId: id,
    newDishName: null,
    eatenOn: todayIso,
    diners: answers.diners,
    guests: answers.guests,
    location: answers.location ?? "home",
    rating: null,
    note: null,
    withLeftovers: answers.leftovers ?? false,
  })
}
