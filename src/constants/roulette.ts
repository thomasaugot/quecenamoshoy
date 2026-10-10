import type { DishProtein } from "@/types/database"

// Quick preference chips (brief §3.7). A preference DECIDES the wheel (utils/roulette buildWheel):
// with a match, only matches go on it; `avoid` chips take their matches off it.
// words: matched in the dish name/description (es/en/fr, accents ignored). Labels: locales.
export type PreferenceChip = {
  key: string
  avoid?: boolean
  proteins?: readonly DishProtein[]
  traits?: readonly string[]
  words?: readonly string[]
}

export const PREFERENCE_CHIPS = [
  { key: "creamy", words: ["nata", "crema", "cremos", "queso", "carbonara", "bechamel", "cream", "creamy", "cheese", "creme", "fromage", "gratin"] },
  { key: "pasta", traits: ["pasta"], words: ["pasta", "pastas", "espagueti", "espaguetis", "spaghetti", "macarron", "macarrones", "lasana", "lasagna", "lasagne", "tallarin", "tallarines", "pates", "ravioli", "raviolis", "gnocchi", "tagliatelle", "tagliatelles", "penne", "fusilli", "tiburones", "cannellonis", "canelones", "carbonara", "pesto", "bolognese", "bolonesa"] },
  { key: "light", traits: ["light", "salad", "soup"], words: ["ensalada", "salad", "salade", "sopa", "soup", "soupe", "crema", "veloute", "poke", "tartar", "carpaccio", "gazpacho"] },
  { key: "comfort", traits: ["comfort", "oven"], words: ["gratin", "gratinado", "gratine", "lasana", "lasagna", "lasagne", "pure", "puree", "guiso", "estofado", "cocido", "potaje", "ragout", "mijote", "blanquette", "bourguignon", "hachis", "parmentier", "tartiflette", "raclette", "fondue", "pastel", "canelones", "cannellonis", "quiche", "croquetas", "stew", "pie", "curry", "chili", "risotto", "carbonara", "mac", "endive"] },
  { key: "fish", proteins: ["fish", "seafood"], words: ["pescado", "fish", "poisson", "merluza", "salmon", "saumon", "bacalao", "morue", "cabillaud", "atun", "thon", "dorada", "lubina", "gambas", "crevettes", "brandade"] },
  { key: "rice", traits: ["rice"], words: ["arroz", "paella", "risotto", "rice", "riz"] },
  { key: "no_meat", avoid: true, proteins: ["red_meat", "pork", "poultry"] },
] as const satisfies readonly PreferenceChip[]

// The wheel: 6–8 candidates (brief §3.7)
export const WHEEL_MIN = 6
export const WHEEL_MAX = 8

// Words that say nothing about the dish, left out of the typed preference
export const PREFERENCE_STOPWORDS = [
  "con", "sin", "de", "del", "la", "las", "los", "el", "un", "una", "algo", "mas", "muy", "hoy", "que", "para", "por",
  "with", "without", "some", "something", "the", "and", "more", "tonight",
  "avec", "sans", "des", "les", "une", "quelque", "chose", "plus", "pour", "soir", "envie",
]

// Thomas, 2026-10-10: "i selected fish and ended up with a quiche" — matches only, no top-up.

// Weights
export const PREFERENCE_BOOST = 6          // matches what I feel like tonight
export const PREFERENCE_DAMP = 0.3         // matches what I said I don't want
export const LOVED_BY_BONUS = 1            // + per diner who loves it
export const GOAL_BEHIND_BOOST = 1.5       // counts toward a goal that is behind
export const GOAL_OVER_DAMP = 0.5          // counts toward a limit already reached
export const UNKNOWN_PROTEIN_DAMP = 0.6    // a diet at the table and we don't know what the dish is
