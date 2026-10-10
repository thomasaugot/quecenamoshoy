import { QueryClient } from "@tanstack/react-query"

// Default = "the user's own data they edit here" (14-PERFORMANCE): fresh for a minute, every
// mutation invalidates what it changed. A query that needs another staleTime sets it itself.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 10 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})
