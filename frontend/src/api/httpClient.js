import axios from 'axios'
import { ApiError } from './ApiError'
import { tokenStorage } from './tokenStorage'

/**
 * The one axios instance every module uses to call the backend. It attaches the bearer token and turns every
 * failure into an ApiError.
 *
 * A 401 from an endpoint that requires a token means the session is over (expired or invalid token), so the
 * registered listeners (the AuthProvider) are told and sign the user out. Endpoints where 401 just means
 * "wrong credentials" (login, register) must pass `{ skipUnauthorizedHandler: true }` in the request config,
 * otherwise a mistyped password would look like an expired session.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

const unauthorizedListeners = new Set()

/**
 * Registers a function called when an authenticated request comes back 401.
 * @param {(error: ApiError) => void} listener
 * @returns {() => void} call it to unregister
 */
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

httpClient.interceptors.request.use((config) => {
  const session = tokenStorage.get()
  if (session) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`)
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const apiError = toApiError(error)
    if (apiError.status === 401 && !error.config?.skipUnauthorizedHandler) {
      unauthorizedListeners.forEach((listener) => listener(apiError))
    }
    return Promise.reject(apiError)
  },
)

function toApiError(error) {
  const response = error.response
  if (!response) {
    return new ApiError(0, error.message || 'No response from server', { cause: error })
  }

  const body = response.data && typeof response.data === 'object' ? response.data : undefined
  return new ApiError(response.status, body?.message || response.statusText || 'Request failed', {
    body,
    cause: error,
  })
}
