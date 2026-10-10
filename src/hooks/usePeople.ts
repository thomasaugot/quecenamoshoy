import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "use-intl"
import { queryKeys } from "@/constants/query-keys"
import { createPerson, deletePerson, listPeople, renamePerson, setGoal, setRestriction } from "@/services/people"
import { showToast } from "@/stores/toast-store"
import type { Person } from "@/types/person"
import { logger } from "@/utils/logger"

export const usePeople = () =>
  useQuery({ queryKey: queryKeys.people.list, queryFn: listPeople, staleTime: 5 * 60_000, meta: { persist: true } })

type ToastKey = "added" | "renamed" | "removed" | "saved"

// Every write: toast, invalidate everything under ["people"] (me included). Chip and goal
// toggles also patch the cache first (`optimistic`), so a tap answers at once and rolls back
// on failure.
const usePeopleWrite = <V,>(
  write: (vars: V) => Promise<void>,
  toast: ToastKey,
  optimistic?: (people: Person[], vars: V) => Person[],
) => {
  const t = useTranslations("settings.toasts")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: write,
    onMutate: async (vars: V) => {
      if (!optimistic) return undefined
      await queryClient.cancelQueries({ queryKey: queryKeys.people.list })
      const previous = queryClient.getQueryData<Person[]>(queryKeys.people.list)
      if (previous) queryClient.setQueryData(queryKeys.people.list, optimistic(previous, vars))
      return { previous }
    },
    onError: (error, _vars, context) => {
      logger.error("people write failed", error)
      if (context?.previous) queryClient.setQueryData(queryKeys.people.list, context.previous)
      showToast(t("failed"), "error")
    },
    onSuccess: () => showToast(t(toast), "success"),
    // a removed person also disappears from every dish's "loved by"
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.people.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
    ]),
  })
}

export const useCreatePerson = () => usePeopleWrite(createPerson, "added")
export const useRenamePerson = () => usePeopleWrite(renamePerson, "renamed")
export const useDeletePerson = () => usePeopleWrite(deletePerson, "removed")

export const useSetRestriction = () =>
  usePeopleWrite(setRestriction, "saved", (people, { personId, kind, key, label = null, on }) =>
    people.map((p) => p.id !== personId ? p : {
      ...p,
      restrictions: on
        ? [...p.restrictions, { kind, key, label }]
        : p.restrictions.filter((r) => !(r.kind === kind && r.key === key)),
    }))

export const useSetGoal = () =>
  usePeopleWrite(setGoal, "saved", (people, { personId, key, perWeek }) =>
    people.map((p) => p.id !== personId ? p : {
      ...p,
      goals: perWeek === null
        ? p.goals.filter((g) => g.key !== key)
        : [...p.goals.filter((g) => g.key !== key), { key, perWeek }],
    }))
