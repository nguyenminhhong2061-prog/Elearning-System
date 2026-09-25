/**
 * Keeps the access token across page reloads. The token lives in localStorage because the backend is stateless
 * (no cookies, no refresh token) and a memory-only token would be lost on every F5. The trade-off is that
 * script running on the page can read it, so never render untrusted HTML (no dangerouslySetInnerHTML).
 *
 * localStorage can throw (private mode, blocked site data), so every access is guarded. When it is unavailable
 * the session is kept in memory: the user can still work, but must log in again after a reload.
 */

const STORAGE_KEY = 'linguastep.session'

let memoryCopy = null

function read() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return memoryCopy
  }
}

function write(value) {
  memoryCopy = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage is unavailable; memoryCopy is used instead.
  }
}

function remove() {
  memoryCopy = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to remove.
  }
}

export const tokenStorage = {
  /** localStorage key, exposed so other tabs' "storage" events can be recognized. */
  key: STORAGE_KEY,

  /**
   * The stored session, or null when there is none, it is corrupt, or it has expired. Corrupt and expired
   * entries are deleted on the way.
   * @returns {{ accessToken: string, expiresAt: number } | null} expiresAt is epoch milliseconds
   */
  get() {
    const raw = read()
    if (!raw) return null

    try {
      const session = JSON.parse(raw)
      const valid = typeof session?.accessToken === 'string' && typeof session?.expiresAt === 'number'
      if (valid && session.expiresAt > Date.now()) return session
    } catch {
      // Falls through to removal below.
    }
    remove()
    return null
  },

  /** @param {{ accessToken: string, expiresIn: number }} token expiresIn is in seconds, as the API returns it */
  save({ accessToken, expiresIn }) {
    write(JSON.stringify({ accessToken, expiresAt: Date.now() + expiresIn * 1000 }))
  },

  clear: remove,
}
