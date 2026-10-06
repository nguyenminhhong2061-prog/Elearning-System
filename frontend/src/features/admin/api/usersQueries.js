import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys, FRESH_ON_OPEN } from './keys'
import { getUser, getUsers, getUsersSummary, setUserStatus } from './usersApi'

// Hooks of the admin user pages (scenario 25).

export function useAdminUsers(filters) {
  return useQuery({
    queryKey: adminKeys.userPage(filters),
    queryFn: () => getUsers(filters),
    placeholderData: keepPreviousData,
    ...FRESH_ON_OPEN,
  })
}

export function useUsersSummary() {
  return useQuery({ queryKey: adminKeys.usersSummary, queryFn: getUsersSummary, ...FRESH_ON_OPEN })
}

export function useAdminUser(id) {
  return useQuery({ queryKey: adminKeys.user(id), queryFn: () => getUser(id), ...FRESH_ON_OPEN })
}

export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => setUserStatus(id, status),
    onSuccess: (user) => {
      queryClient.setQueryData(adminKeys.user(user.id), user)
      // Lists, counters and the overview's "locked accounts" line change too.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'page'] }),
        queryClient.invalidateQueries({ queryKey: adminKeys.usersSummary }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
      ])
    },
  })
}
