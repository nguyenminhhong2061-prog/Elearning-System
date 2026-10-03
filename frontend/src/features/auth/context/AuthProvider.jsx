import { useCallback, useEffect, useMemo, useState } from 'react'
import { isApiError } from '@/api/ApiError'
import { ROLES } from '@/api/constants'
import { onUnauthorized } from '@/api/httpClient'
import { tokenStorage } from '@/api/tokenStorage'
import * as authApi from '../authApi'
import { AuthContext } from './authContext'
import { useSessionKeepAlive } from './useSessionKeepAlive'

const ANONYMOUS = { status: 'anonymous', user: null, endReason: null }
const LOADING = { status: 'loading', user: null, endReason: null }

/** Code of the 401 the backend sends for a token whose account an admin has locked (scenario 25). */
const ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'

/** Whether a stored session (the raw localStorage value) had run out when it was removed. */
function hasExpired(rawSession) {
  try {
    const expiresAt = JSON.parse(rawSession)?.expiresAt
    return typeof expiresAt === 'number' && expiresAt <= Date.now()
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  // A stored token is not trusted until the server confirms it (see the effect below), so the app starts in
  // "loading" instead of showing the login page for a split second on every reload.
  const [state, setState] = useState(() => (tokenStorage.get() ? LOADING : ANONYMOUS))

  // Confirm the stored token and fetch the current user. Runs on start-up, after retry(), and when another tab
  // signs in.
  useEffect(() => {
    if (state.status !== 'loading') return undefined

    let cancelled = false
    authApi.getCurrentUser().then(
      (user) => {
        if (!cancelled) setState({ status: 'authenticated', user, endReason: null })
      },
      (error) => {
        if (cancelled) return
        // A 401 means the token was rejected; the unauthorized listener below has already signed the user out.
        // Anything else means the check itself failed (server down), which is not the same as being logged out.
        if (!(isApiError(error) && error.status === 401)) {
          setState({ status: 'error', user: null, endReason: null })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [state.status])

  const endSession = useCallback((endReason) => {
    tokenStorage.clear()
    setState((current) => (current.status === 'anonymous' ? current : { status: 'anonymous', user: null, endReason }))
  }, [])

  // Any authenticated request answered with 401 ends the session: the token expired, or the account was locked.
  useEffect(
    () => onUnauthorized((error) => endSession(error.body?.code === ACCOUNT_LOCKED ? 'locked' : 'expired')),
    [endSession],
  )

  const expire = useCallback(() => endSession('expired'), [endSession])
  const updateUser = useCallback((user) => {
    setState((current) =>
      current.status === 'authenticated' && current.user.id === user.id ? { ...current, user } : current,
    )
  }, [])
  useSessionKeepAlive({
    userId: state.status === 'authenticated' ? state.user.id : undefined,
    onExpired: expire,
    onRefreshed: updateUser,
  })

  // The "storage" event only fires in the *other* tabs, so this keeps every open tab in step: logging out in one
  // logs out all, and logging in as someone else in one makes the rest reload that user. A token refreshed for the
  // same user changes nothing here: every request reads the token from storage.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== null && event.key !== tokenStorage.key) return

      const session = tokenStorage.get()
      if (session) {
        setState((current) => {
          if (current.status === 'authenticated' && session.userId === current.user.id) return current
          return current.status === 'loading' ? current : LOADING
        })
      } else {
        // An expired token is also removed from storage (by whichever tab read it first): say so, as this tab would.
        const endReason = hasExpired(event.oldValue) ? 'expired' : 'logout'
        setState((current) => (current.status === 'anonymous' ? current : { status: 'anonymous', user: null, endReason }))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const { accessToken, expiresIn, user } = await authApi.login({ email, password })
    tokenStorage.save({ accessToken, expiresIn, userId: user.id })
    setState({ status: 'authenticated', user, endReason: null })
    return user
  }, [])

  // Registration only creates the account: the new learner then signs in on the login page (scenario 1, step 7).
  const register = useCallback(async ({ fullName, email, password }) => {
    await authApi.register({ fullName, email, password })
  }, [])

  // Tokens are stateless on the server, so signing out is just forgetting the token (see AuthController).
  const logout = useCallback(() => {
    tokenStorage.clear()
    setState({ status: 'anonymous', user: null, endReason: 'logout' })
  }, [])

  const retry = useCallback(() => setState(LOADING), [])

  // Reads the signed-in user again, for example after a comprehensive test changed their level, without the loading
  // screen of a full check. A reply for another account (the token changed in another tab meanwhile) is dropped; the
  // storage listener above reloads that user.
  const refreshUser = useCallback(async () => {
    const user = await authApi.getCurrentUser()
    updateUser(user)
    return user
  }, [updateUser])

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === 'authenticated',
      isAdmin: state.user?.role === ROLES.ADMIN,
      login,
      register,
      logout,
      retry,
      refreshUser,
    }),
    [state, login, register, logout, retry, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
