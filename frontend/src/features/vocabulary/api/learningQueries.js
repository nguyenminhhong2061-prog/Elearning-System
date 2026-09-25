import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLearningHistory, getLearningSummary, getStudySession, submitReview } from './learningApi'
import { vocabularyKeys } from './queries'

export const learningKeys = {
  all: ['learning'],
  summary: () => [...learningKeys.all, 'summary'],
  history: () => [...learningKeys.all, 'history'],
}

// Deliberately outside both roots above: invalidating progress after each review must not refetch the session that
// is being studied, which would reshuffle the cards under the learner's hands.
const sessionKey = (source, round) => ['study-session', source, round]

export const HISTORY_PAGE_SIZE = 20

/** Due count and statistics; used by the review reminder and the history tab. */
export function useLearningSummary() {
  return useQuery({ queryKey: learningKeys.summary(), queryFn: getLearningSummary })
}

export function useLearningHistory() {
  return useInfiniteQuery({
    queryKey: learningKeys.history(),
    queryFn: ({ pageParam }) => getLearningHistory({ page: pageParam, size: HISTORY_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  })
}

/**
 * The cards of one study session. `round` starts a fresh session when it changes ("Học tiếp"); a session is fetched
 * once and never refetched or cached for later, since the cards depend on the moment it starts.
 */
export function useStudySession(source, round, { enabled = true } = {}) {
  return useQuery({
    queryKey: sessionKey(source, round),
    queryFn: () => getStudySession(source),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnReconnect: false,
  })
}

/** Saves one rating, then marks every count and learning status as out of date. */
export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.all })
      queryClient.invalidateQueries({ queryKey: learningKeys.all })
    },
  })
}
