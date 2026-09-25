import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/features/auth/context/useAuth'

function shouldRetry(failureCount, error) {
  // 4xx answers will not change on a retry, and 401 is already handled by httpClient. A dropped connection or a
  // 5xx gets one more attempt. Tests fail fast instead.
  if (import.meta.env.MODE === 'test') return false
  const status = error?.status
  return failureCount < 1 && (status === 0 || status >= 500)
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  })
}

function UserQueryScope({ children }) {
  const [client] = useState(createQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/**
 * Server data cache (TanStack Query) for the app. Each signed-in user gets a fresh cache, so data that depends on
 * who is asking (for example learning progress) can never be shown to the next account on the same browser.
 */
export function QueryProvider({ children }) {
  const { user } = useAuth()
  return <UserQueryScope key={user?.id ?? 'anonymous'}>{children}</UserQueryScope>
}
