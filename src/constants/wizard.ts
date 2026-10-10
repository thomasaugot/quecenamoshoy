// The questions, in order, before the results (brief §3.2)
export const WIZARD_QUESTIONS = ["location", "temp", "leftovers", "diners"] as const

// Answer options of the one-tap questions
export const WIZARD_OPTIONS = {
  location: ["home", "travel"],
  temp: ["hot", "cold", "any"],
  leftovers: ["yes", "no"],
} as const
