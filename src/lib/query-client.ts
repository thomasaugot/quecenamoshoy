import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient, type Query } from "@tanstack/react-query"
import { del, get, set } from "idb-keyval"

// Default = "the user's own data they edit here" (14-PERFORMANCE): fresh for a minute, every
// mutation invalidates what it changed. A query that needs another staleTime sets it itself.
// gcTime ≥ the persisted maxAge, or a persisted query is dropped before it is saved.
export const OFFLINE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: OFFLINE_MAX_AGE, retry: 1, refetchOnWindowFocus: false },
  },
})

// Offline reading (brief §8): what I've already seen — dishes, recipes, history, people,
// settings, my kitchen — is kept in IndexedDB for a week. Only queries marked
// `meta: { persist: true }` are written. Wiped on sign-out (useSignOut).
export const persister = createAsyncStoragePersister({
  storage: { getItem: (k) => get<string>(k).then((v) => v ?? null), setItem: (k, v) => set(k, v), removeItem: (k) => del(k) },
  key: "query-cache",
})

export const persistOptions = {
  persister,
  maxAge: OFFLINE_MAX_AGE,
  buster: "1",   // bump when a persisted query's data shape changes
  dehydrateOptions: {
    shouldDehydrateQuery: (q: Query) => q.meta?.persist === true && q.state.status === "success",
  },
}
