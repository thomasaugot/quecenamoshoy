// The questions, in order, before the results (brief §3.2)
export const WIZARD_QUESTIONS = ["location", "temp", "leftovers", "fridge", "diners"] as const

// Answer options of the one-tap questions
export const WIZARD_OPTIONS = {
  location: ["home", "travel"],
  temp: ["hot", "cold", "any"],
  leftovers: ["yes", "no"],
} as const

// The optional note for tonight, sent to the suggest function (which caps it too)
export const WIZARD_NOTE_MAX = 300

// "Des choses à utiliser dans le frigo ?" — at most this many, each this long (the function checks too)
export const FRIDGE_MAX_ITEMS = 10
export const FRIDGE_ITEM_MAX = 40
