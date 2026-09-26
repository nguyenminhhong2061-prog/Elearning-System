import { AxiosError } from 'axios'
import { httpClient } from '@/api/httpClient'

/**
 * Replaces the network under the real httpClient with fake endpoints, so tests exercise the whole frontend
 * stack (forms, authApi, interceptors, AuthProvider, router) without a backend.
 *
 * `routes` maps "METHOD /path" (without the query string) to a function receiving { body, params, authorization }
 * and returning { status?, data? } (status defaults to 200) or { networkError: true } to simulate an unreachable
 * server. `params` is the query parameters object passed to axios, if any. Requests to a path with no route fail
 * the test loudly.
 *
 * @returns {{ calls: Array<{ key: string, body: unknown, params?: object, authorization: string | undefined }>, restore: () => void }}
 */
export function installFakeBackend(routes) {
  const originalAdapter = httpClient.defaults.adapter
  const calls = []

  httpClient.defaults.adapter = async (config) => {
    const key = `${config.method.toUpperCase()} ${config.url}`
    const handler = routes[key]
    if (!handler) throw new Error(`The fake backend has no route for ${key}`)

    // JSON bodies arrive as strings; an upload (a Blob such as a recording) is passed on as it is.
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const authorization = config.headers.get('Authorization') || undefined
    const params = config.params
    calls.push({ key, body, params, authorization })

    const result = await handler({ body, params, authorization })
    if (result.networkError) {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
    }

    const response = { status: result.status ?? 200, statusText: '', data: result.data, headers: {}, config }
    if (response.status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${response.status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        {},
        response,
      )
    }
    return response
  }

  return {
    calls,
    restore() {
      httpClient.defaults.adapter = originalAdapter
    },
  }
}

/** A learner as the backend returns it (see UserResponse). */
export const learner = {
  id: 7,
  fullName: 'Nguyễn Minh Hồng',
  email: 'hong@example.com',
  role: 'LEARNER',
  status: 'ACTIVE',
  currentLevel: null,
  createdAt: '2026-09-25T03:00:00Z',
}

export const admin = { ...learner, id: 1, fullName: 'Administrator', email: 'admin@example.com', role: 'ADMIN' }

/** Body of a successful POST /api/auth/login (see AuthTokenResponse). */
export function loginResponse(user = learner, accessToken = 'token-abc') {
  return { accessToken, tokenType: 'Bearer', expiresIn: 28800, user }
}
