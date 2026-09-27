import { useQuery } from '@tanstack/react-query'
import { testsKeys } from './keys'
import { getAttemptResult, getTest, getTests } from './testsApi'

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
