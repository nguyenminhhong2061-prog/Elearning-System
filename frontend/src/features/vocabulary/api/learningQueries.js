import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nextPageParam } from '@/api/pagination'
import { HISTORY_PAGE_SIZE } from '../constants'
import { learningKeys, listKeys, vocabularyKeys } from './keys'
import { getLearningHistory, getLearningSummary, getStudySession, submitReview } from './learningApi'

// Hooks for flashcard sessions, reviews and the learning history.

// Deliberately outside the roots of keys.js: invalidating progress after each review must not refetch the session that
// is being studied, which would reshuffle the cards under the learner's hands.
const sessionKey = (source, round) => ['study-session', source, round]

/** Due count and statistics; used by the review reminder and the history tab. */
export function useLearningSummary() {
  return useQuery({ queryKey: learningKeys.summary(), queryFn: getLearningSummary })
}

/**
 * Reviewed words, 20 at a time ("Xem thêm"). Each filter has its own cache entry, so switching back to a list shows
 * it at once.
 * @param {{ status?: 'LEARNING' | 'MASTERED', reviewedToday?: boolean }} [filter]
 */
export function useLearningHistory(filter = {}) {
  return useInfiniteQuery({
    queryKey: learningKeys.history(filter),
    queryFn: ({ pageParam }) => getLearningHistory({ ...filter, page: pageParam, size: HISTORY_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
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

/** Saves one rating, then marks every count and learning status (topics, lists, statistics) as out of date. */
export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.all })
      queryClient.invalidateQueries({ queryKey: learningKeys.all })
      queryClient.invalidateQueries({ queryKey: listKeys.all })
    },
  })
}
