// The signed-in state of the app, and every event that changes it. AuthProvider dispatches these events at the right
// moments; this file alone answers "when is the user signed in, signed out, or still being checked?".

/** @typedef {import('./authContext').AuthState} AuthState */

/** Nobody is signed in. */
export const ANONYMOUS = Object.freeze({ status: 'anonymous', user: null, endReason: null })
/** A stored token is being checked with the server. */
export const LOADING = Object.freeze({ status: 'loading', user: null, endReason: null })

/**
 * @param {AuthState} state
 * @param {{ type: string, user?: import('@/api/types').User, userId?: number, reason?: string }} action
 * @returns {AuthState}
 */
export function authReducer(state, action) {
  switch (action.type) {
    // Check the stored token again: after "Thử lại" on the connection error screen.
    case 'checkStarted':
      return state.status === 'loading' ? state : LOADING

    // The server accepted the stored token or the credentials.
    case 'signedIn':
      return { status: 'authenticated', user: action.user, endReason: null }

    // The check itself failed (server unreachable), which is not the same as being signed out.
    case 'checkFailed':
      return { status: 'error', user: null, endReason: null }

    // The session ended. reason: 'logout' (the user signed out), 'expired' (inactive too long, or the token was
    // refused), or 'locked' (an admin locked the account). The login page explains it.
    case 'signedOut':
      return state.status === 'anonymous' ? state : { status: 'anonymous', user: null, endReason: action.reason }

    // A fresh profile of the signed-in user (a new level, a refreshed token). One of another account is ignored.
    case 'userUpdated':
      return state.status === 'authenticated' && state.user.id === action.user.id ? { ...state, user: action.user } : state

    // Another tab saved a token. For the same user it is only a refreshed token; anyone else is checked again.
    case 'tokenChanged':
      if (state.status === 'authenticated' && state.user.id === action.userId) return state
      return state.status === 'loading' ? state : LOADING

    default:
      throw new Error(`Unknown auth action: ${action.type}`)
  }
}
