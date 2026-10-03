import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys, FRESH_ON_OPEN } from './keys'
import { createTest, duplicateTest, getTest, getTests, updateTest } from './testsApi'

// Hooks of the admin test pages (scenario 24).

export function useAdminTests() {
  return useQuery({ queryKey: adminKeys.tests, queryFn: getTests, ...FRESH_ON_OPEN })
}

export function useAdminTest(id) {
  return useQuery({ queryKey: adminKeys.test(id), queryFn: () => getTest(id), enabled: id !== null, ...FRESH_ON_OPEN })
}

function useTestMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (test) => {
      queryClient.setQueryData(adminKeys.test(test.id), test)
      return queryClient.invalidateQueries({ queryKey: adminKeys.tests, exact: true })
    },
  })
}

export function useSaveTest() {
  return useTestMutation(({ id, ...test }) => (id ? updateTest(id, test) : createTest(test)))
}

export function useDuplicateTest() {
  return useTestMutation(({ id, ...copy }) => duplicateTest(id, copy))
}
