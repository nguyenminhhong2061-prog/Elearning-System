import { useCallback, useEffect, useMemo, useState } from 'react'
import { isApiError } from '@/api/ApiError'
import { ROLES } from '@/api/constants'
import { onUnauthorized } from '@/api/httpClient'
import { tokenStorage } from '@/api/tokenStorage'
import * as authApi from '../authApi'
import { AuthContext } from './authContext'

const ANONYMOUS = { status: 'anonymous', user: null, endReason: null }
const LOADING = { status: 'loading', user: null, endReason: null }

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

  // Any authenticated request answered with 401 (expired or invalid token) ends the session.
  useEffect(
    () =>
      onUnauthorized(() => {
        tokenStorage.clear()
        setState((current) =>
          current.status === 'anonymous' ? current : { status: 'anonymous', user: null, endReason: 'expired' },
        )
      }),
    [],
  )

  // The "storage" event only fires in the *other* tabs, so this keeps every open tab in step: logging out in one
  // logs out all, and logging in as someone else in one makes the rest reload that user.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== null && event.key !== tokenStorage.key) return

      if (tokenStorage.get()) {
        setState((current) => (current.status === 'loading' ? current : LOADING))
      } else {
        setState((current) =>
          current.status === 'anonymous' ? current : { status: 'anonymous', user: null, endReason: 'logout' },
        )
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const { accessToken, expiresIn, user } = await authApi.login({ email, password })
    tokenStorage.save({ accessToken, expiresIn })
    setState({ status: 'authenticated', user, endReason: null })
    return user
  }, [])

  const register = useCallback(
    async ({ fullName, email, password }) => {
      // Registration returns no token, so the new learner is logged in right after. If only that second step
      // fails, the account exists and the caller sends the user to the login page.
      await authApi.register({ fullName, email, password })
      try {
        await login({ email, password })
        return { signedIn: true }
      } catch {
        return { signedIn: false }
      }
    },
    [login],
  )

  // Tokens are stateless on the server, so signing out is just forgetting the token (see AuthController).
  const logout = useCallback(() => {
    tokenStorage.clear()
    setState({ status: 'anonymous', user: null, endReason: 'logout' })
  }, [])

  const retry = useCallback(() => setState(LOADING), [])

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === 'authenticated',
      isAdmin: state.user?.role === ROLES.ADMIN,
      login,
      register,
      logout,
      retry,
    }),
    [state, login, register, logout, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
