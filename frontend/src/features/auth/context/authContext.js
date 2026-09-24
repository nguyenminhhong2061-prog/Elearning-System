import { createContext } from 'react'

/**
 * Shape of the value provided by AuthProvider (read it through useAuth()):
 *
 * @typedef {object} AuthContextValue
 * @property {'loading' | 'authenticated' | 'anonymous' | 'error'} status
 *   loading: a stored token is being checked with the server; error: that check failed for a reason other
 *   than the token being rejected (server unreachable), so retry() can be offered.
 * @property {import('@/api/types').User | null} user set only while status is 'authenticated'
 * @property {'expired' | 'logout' | null} endReason why the last session ended, so the login page can explain
 *   ("expired") and the router does not send the user back to the page they just logged out from ("logout")
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 * @property {(credentials: { email: string, password: string }) => Promise<import('@/api/types').User>} login
 *   rejects with an ApiError when the credentials are refused
 * @property {(details: { fullName: string, email: string, password: string }) => Promise<{ signedIn: boolean }>} register
 *   creates the account and then logs in; signedIn is false if the account was created but the automatic login failed
 * @property {() => void} logout
 * @property {() => void} retry
 */

/** @type {import('react').Context<AuthContextValue | null>} */
export const AuthContext = createContext(null)
