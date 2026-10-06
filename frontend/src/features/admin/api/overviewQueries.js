import { useQuery } from '@tanstack/react-query'
import { adminKeys, FRESH_ON_OPEN } from './keys'
import { getStats } from './overviewApi'

// Hooks of the admin overview (scenario 26).

export function useStats(period) {
  return useQuery({ queryKey: adminKeys.stats(period), queryFn: () => getStats(period), ...FRESH_ON_OPEN })
}
