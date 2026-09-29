import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { testsKeys } from './keys'
import { getAttemptResult, getTest, getTests, submitAttempt } from './testsApi'

export function useTests() {
  return useQuery({ queryKey: testsKeys.list(), queryFn: getTests })
}

/** @param {number | null} id null when the URL id is invalid: nothing is fetched */
export function useTest(id) {
  return useQuery({ queryKey: testsKeys.detail(id), queryFn: () => getTest(id), enabled: id !== null })
}

/** @param {number | null} attemptId */
export function useTestResult(attemptId) {
  return useQuery({
    queryKey: testsKeys.result(attemptId),
    queryFn: () => getAttemptResult(attemptId),
    enabled: attemptId !== null,
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
    },
  })
}
