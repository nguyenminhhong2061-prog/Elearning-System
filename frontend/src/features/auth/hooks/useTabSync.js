import { useEffect, useEffectEvent } from 'react'
import { tokenStorage } from '@/api/tokenStorage'

/** Whether a stored session (the raw localStorage value) had run out when it was removed. */
function hasExpired(rawSession) {
  try {
    const expiresAt = JSON.parse(rawSession)?.expiresAt
    return typeof expiresAt === 'number' && expiresAt <= Date.now()
  } catch {
    return false
  }
}

/**
 * Keeps every open tab on the same account. The browser's "storage" event only fires in the *other* tabs, so when one
 * tab signs in, signs out or refreshes its token, the rest hear about it here.
 *
 * @param {object} options
 * @param {(session: { userId?: number }) => void} options.onTokenSaved another tab signed in or refreshed its token
 * @param {(reason: 'expired' | 'logout') => void} options.onTokenRemoved another tab signed out, or found the token
 *   expired and removed it (then this tab says so too)
 */
export function useTabSync({ onTokenSaved, onTokenRemoved }) {
  const handleStorage = useEffectEvent((event) => {
    if (event.key !== null && event.key !== tokenStorage.key) return

    const session = tokenStorage.get()
    if (session) onTokenSaved(session)
    else onTokenRemoved(hasExpired(event.oldValue) ? 'expired' : 'logout')
  })

  useEffect(() => {
    const listener = (event) => handleStorage(event)
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [])
}
