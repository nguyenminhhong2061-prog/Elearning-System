import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { isApiError } from '@/api/ApiError'
import { ROLES } from '@/api/constants'
import { onUnauthorized } from '@/api/httpClient'
import { tokenStorage } from '@/api/tokenStorage'
import * as authApi from '../api/authApi'
import { useSessionKeepAlive } from '../hooks/useSessionKeepAlive'
import { useTabSync } from '../hooks/useTabSync'
import { AuthContext } from './authContext'
import { ANONYMOUS, authReducer, LOADING } from './authReducer'

/** Code of the 401 the backend sends for a token whose account an admin has locked (scenario 25). */
const ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'

/**
 * Who is signed in, for the whole app (read it with useAuth()). The possible states and the events that change them
 * are in authReducer.js; this component sends those events at the right moments: checking a stored token, signing in
 * and out, a 401 from any request, an expired session, and what other tabs do.
 */
export function AuthProvider({ children }) {
  // A stored token is not trusted until the server confirms it (see the effect below), so the app starts in
  // "loading" instead of showing the login page for a split second on every reload.
  const [state, dispatch] = useReducer(authReducer, null, () => (tokenStorage.get() ? LOADING : ANONYMOUS))

  // Confirm the stored token and fetch the current user, whenever the state is "loading": on start-up, after retry(),
  // and when another tab signs in.
  useEffect(() => {
    if (state.status !== 'loading') return undefined

    let cancelled = false
    authApi.getCurrentUser().then(
      (user) => {
        if (!cancelled) dispatch({ type: 'signedIn', user })
      },
      (error) => {
        if (cancelled) return
        // A 401 means the token was rejected; the unauthorized listener below has already signed the user out.
        // Anything else means the check itself failed (server down), which is not the same as being logged out.
        if (!(isApiError(error) && error.status === 401)) dispatch({ type: 'checkFailed' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [state.status])

  const endSession = useCallback((reason) => {
    tokenStorage.clear()
    dispatch({ type: 'signedOut', reason })
  }, [])

  // Any authenticated request answered with 401 ends the session: the token expired, or the account was locked.
  useEffect(
    () => onUnauthorized((error) => endSession(error.body?.code === ACCOUNT_LOCKED ? 'locked' : 'expired')),
    [endSession],
  )

  const updateUser = useCallback((user) => dispatch({ type: 'userUpdated', user }), [])

  // Tokens are short-lived: renewed while the user is active, and the first action after one expired ends the session.
  const expire = useCallback(() => endSession('expired'), [endSession])
  useSessionKeepAlive({
    userId: state.status === 'authenticated' ? state.user.id : undefined,
    onExpired: expire,
    onRefreshed: updateUser,
  })

  // Signing in or out in another tab does the same here. A token refreshed for the same user changes nothing: every
  // request reads the token from storage.
  useTabSync({
    onTokenSaved: (session) => dispatch({ type: 'tokenChanged', userId: session.userId }),
    onTokenRemoved: (reason) => dispatch({ type: 'signedOut', reason }),
  })

  const login = useCallback(async ({ email, password }) => {
    const { accessToken, expiresIn, user } = await authApi.login({ email, password })
    tokenStorage.save({ accessToken, expiresIn, userId: user.id })
    dispatch({ type: 'signedIn', user })
    return user
  }, [])

  // Registration only creates the account: the new learner then signs in on the login page (scenario 1, step 7).
  const register = useCallback(async ({ fullName, email, password }) => {
    await authApi.register({ fullName, email, password })
  }, [])

  // Tokens are stateless on the server, so signing out is just forgetting the token (see AuthController).
  const logout = useCallback(() => endSession('logout'), [endSession])

  const retry = useCallback(() => dispatch({ type: 'checkStarted' }), [])

  // Reads the signed-in user again, for example after a comprehensive test changed their level, without the loading
  // screen of a full check. A reply for another account (the token changed in another tab meanwhile) is dropped; the
  // tab sync above reloads that user.
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
