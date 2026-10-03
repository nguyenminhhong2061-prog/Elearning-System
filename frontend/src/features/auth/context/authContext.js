import { createContext } from 'react'

/**
 * Who is signed in (see authReducer.js for when each state applies).
 *
 * @typedef {object} AuthState
 * @property {'loading' | 'authenticated' | 'anonymous' | 'error'} status
 *   loading: a stored token is being checked with the server; error: that check failed for a reason other
 *   than the token being rejected (server unreachable), so retry() can be offered.
 * @property {import('@/api/types').User | null} user set only while status is 'authenticated'
 * @property {'expired' | 'locked' | 'logout' | null} endReason why the last session ended, so the login page can
 *   explain ("expired": inactive too long or token rejected; "locked": an admin locked the account) and the router
 *   does not send the user back to the page they just logged out from ("logout")
 */

/**
 * Shape of the value provided by AuthProvider (read it through useAuth()): the state above, plus:
 *
 * @typedef {AuthState & {
 *   isAuthenticated: boolean,
 *   isAdmin: boolean,
 *   login: (credentials: { email: string, password: string }) => Promise<import('@/api/types').User>,
 *   register: (details: { fullName: string, email: string, password: string }) => Promise<void>,
 *   logout: () => void,
 *   retry: () => void,
 *   refreshUser: () => Promise<import('@/api/types').User>,
 * }} AuthContextValue
 *   login rejects with an ApiError when the credentials are refused; register creates the account only (the learner
 *   then signs in on the login page); refreshUser reads the signed-in user again (for example after a level change).
 */

/** @type {import('react').Context<AuthContextValue | null>} */
export const AuthContext = createContext(null)
