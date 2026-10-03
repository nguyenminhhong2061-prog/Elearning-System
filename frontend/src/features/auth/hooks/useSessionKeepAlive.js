import { useEffect, useRef } from 'react'
import { tokenStorage } from '@/api/tokenStorage'
import * as authApi from '../api/authApi'

/** Input that shows the user is still there. Requests alone do not count: a page may poll on its own. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart']

/**
 * Fewest milliseconds between two refresh attempts. Near the session's maximum length a refresh cannot extend the
 * token any more, and a failed attempt (server unreachable) should not be repeated on every key press.
 */
const RETRY_AFTER_MS = 60_000

/**
 * Keeps an active user signed in and ends the session of an inactive one (scenario 3, branch 1a). The server issues
 * short-lived tokens (30 minutes by default): while the user is active, a token past half its life is exchanged for a
 * new one; after a longer inactivity the token has expired, and the next action the user takes ends the session, so
 * they land on the login page with the "session expired" message.
 *
 * @param {object} options
 * @param {number | undefined} options.userId the signed-in user; nothing is watched while there is none
 * @param {() => void} options.onExpired ends the session (stable function)
 * @param {(user: import('@/api/types').User) => void} options.onRefreshed receives the profile sent with a new token
 */
export function useSessionKeepAlive({ userId, onExpired, onRefreshed }) {
  const callbacks = useRef({ onExpired, onRefreshed })
  useEffect(() => {
    callbacks.current = { onExpired, onRefreshed }
  })

  useEffect(() => {
    if (userId == null) return undefined

    let refreshing = false
    let lastAttempt = -Infinity

    function handleActivity() {
      const session = tokenStorage.get()
      if (!session) {
        // The token ran out while the user was away (or another tab signed out): this action ends the session.
        callbacks.current.onExpired()
        return
      }

      const now = Date.now()
      // Sessions saved before issuedAt was recorded have no known lifetime; they simply run until they expire.
      const halfLife = session.issuedAt == null ? 0 : (session.expiresAt - session.issuedAt) / 2
      if (session.expiresAt - now > halfLife || refreshing || now - lastAttempt < RETRY_AFTER_MS) return

      refreshing = true
      lastAttempt = now
      authApi
        .refresh()
        .then(
          ({ accessToken, expiresIn, user }) => {
            // Signed out, or signed in as someone else in another tab, while the request was on its way.
            const stored = tokenStorage.get()
            if (!stored || (stored.userId ?? user.id) !== user.id) return
            tokenStorage.save({ accessToken, expiresIn, userId: user.id })
            callbacks.current.onRefreshed(user)
          },
          // A 401 has already ended the session (see httpClient); anything else is retried after RETRY_AFTER_MS.
          () => {},
        )
        .finally(() => {
          refreshing = false
        })
    }

    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, handleActivity, { capture: true, passive: true }))
    return () =>
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, handleActivity, { capture: true }))
  }, [userId])
}
