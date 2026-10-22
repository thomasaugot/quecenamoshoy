// Every TanStack Query key lives here — never an inline array (04-CLIENT_SERVER).
export const queryKeys = {
  me: ["people", "me"] as const,
  people: { all: ["people"] as const, list: ["people", "list"] as const },
  settings: ["settings"] as const,
  shopping: ["shopping"] as const,
  kitchen: { all: ["kitchen"] as const, items: (location: string) => ["kitchen", location] as const },
  dishes: { all: ["dishes"] as const, list: ["dishes", "list"] as const },
  recipes: { all: ["recipes"] as const, byDish: (dishId: string) => ["recipes", dishId] as const },
  meals: {
    all: ["meals"] as const,
    recent: (days: number) => ["meals", "recent", days] as const,
    history: ["meals", "history"] as const,
    since: (iso: string) => ["meals", "since", iso] as const,
    lastEaten: ["meals", "last-eaten"] as const,
    ofDish: (dishId: string) => ["meals", "dish", dishId] as const,
    unrated: (fromIso: string) => ["meals", "unrated", fromIso] as const,
    month: (month: string) => ["meals", "month", month] as const,
  },
  health: (month: string) => ["health", month] as const,
}
