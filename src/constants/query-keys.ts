// Every TanStack Query key lives here — never an inline array (04-CLIENT_SERVER).
export const queryKeys = {
  me: ["people", "me"] as const,
  people: { all: ["people"] as const, list: ["people", "list"] as const },
  settings: ["settings"] as const,
  kitchen: { all: ["kitchen"] as const, items: (location: string) => ["kitchen", location] as const },
  dishes: { all: ["dishes"] as const, list: ["dishes", "list"] as const },
  recipes: { all: ["recipes"] as const, byDish: (dishId: string) => ["recipes", dishId] as const },
  meals: {
    all: ["meals"] as const,
    recent: (days: number) => ["meals", "recent", days] as const,
    history: ["meals", "history"] as const,
    since: (iso: string) => ["meals", "since", iso] as const,
    lastEaten: ["meals", "last-eaten"] as const,
  },
}
