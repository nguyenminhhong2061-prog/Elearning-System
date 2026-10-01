import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changePlanStatus, createPlan, getStudyPlan, getSuggestions, previewPlan, updateSchedule } from './planApi'

export const planKeys = {
  all: ['plan'],
  current: ['plan', 'current'],
  suggestions: ['plan', 'suggestions'],
}

// Weekly progress and suggestions follow what the learner did on other screens, which do not know this cache: ask
// again each time the page opens.
const FRESH_ON_OPEN = { staleTime: 0 }

export function useStudyPlan() {
  return useQuery({ queryKey: planKeys.current, queryFn: getStudyPlan, ...FRESH_ON_OPEN })
}

export function useSuggestions() {
  return useQuery({ queryKey: planKeys.suggestions, queryFn: getSuggestions, ...FRESH_ON_OPEN })
}

/** POST .../preview: nothing is cached, the draft only lives on the page until it is applied. */
export function usePreviewPlan() {
  return useMutation({ mutationFn: previewPlan })
}

/**
 * The saved plan replaces the one in the cache; goal options are kept (they depend on the level, not the plan). An
 * ended plan is no longer the learner's plan, so the page asks for a new goal.
 */
function useReplacePlan(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (plan) => {
      const current = plan.status === 'COMPLETED' ? null : plan
      queryClient.setQueryData(planKeys.current, (previous) => ({ goalOptions: previous?.goalOptions ?? [], plan: current }))
    },
  })
}

export function useCreatePlan() {
  return useReplacePlan(createPlan)
}

export function useUpdateSchedule() {
  return useReplacePlan(updateSchedule)
}

export function useChangePlanStatus() {
  return useReplacePlan(changePlanStatus)
}
