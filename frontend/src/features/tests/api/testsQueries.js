import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { testsKeys } from './keys'
import { ATTEMPT_STATUS, GRADING_POLL_MS } from '../constants'
import { getAttemptResult, getTest, getTestAttempts, getTests, recordPassagePlay, submitAttempt } from './testsApi'

export function useTests() {
  return useQuery({ queryKey: testsKeys.list(), queryFn: getTests })
}

/** @param {number | null} id null when the URL id is invalid: nothing is fetched */
export function useTest(id) {
  return useQuery({ queryKey: testsKeys.detail(id), queryFn: () => getTest(id), enabled: id !== null })
}

/** The learner's submitted attempts at a test (the history dialog). @param {number} testId */
export function useTestAttempts(testId) {
  return useQuery({ queryKey: testsKeys.attempts(testId), queryFn: () => getTestAttempts(testId) })
}

/**
 * The result of an attempt. While the AI is still grading it (SUBMITTED) the result is fetched again every few
 * seconds, so the page fills in by itself.
 * @param {number | null} attemptId
 */
export function useTestResult(attemptId) {
  return useQuery({
    queryKey: testsKeys.result(attemptId),
    queryFn: () => getAttemptResult(attemptId),
    enabled: attemptId !== null,
    refetchInterval: (query) => (query.state.data?.status === ATTEMPT_STATUS.SUBMITTED ? GRADING_POLL_MS : false),
  })
}

/** POST .../passages/{passageId}/plays: counts one play of a recording before it is played. */
export function useRecordPassagePlay() {
  return useMutation({
    mutationFn: ({ attemptId, passageId }) => recordPassagePlay(attemptId, passageId),
  })
}

/**
 * POST .../submit. The result is cached for the result page, and the test list and this test's detail (progress,
 * "in progress" flag) are marked stale without refetching now: the taking screen still shows them until it leaves.
 */
export function useSubmitAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitAttempt,
    onSuccess: (result) => {
      queryClient.setQueryData(testsKeys.result(result.attemptId), result)
      queryClient.invalidateQueries({ queryKey: testsKeys.list(), refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: testsKeys.detail(result.testId), refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: testsKeys.attempts(result.testId), refetchType: 'none' })
    },
  })
}
