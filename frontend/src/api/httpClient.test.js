import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError'
import { httpClient, onUnauthorized } from './httpClient'
import { tokenStorage } from './tokenStorage'

const originalAdapter = httpClient.defaults.adapter

/** Replaces the network with a function that answers every request the same way. */
function stubServer(status, data = {}) {
  const adapter = vi.fn(async (config) => {
    const response = { status, statusText: '', data, headers: {}, config }
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    return response
  })
  httpClient.defaults.adapter = adapter
  return adapter
}

let unsubscribe = () => {}

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter
  unsubscribe()
})

describe('httpClient', () => {
  let onSessionEnded

  beforeEach(() => {
    onSessionEnded = vi.fn()
    unsubscribe = onUnauthorized(onSessionEnded)
  })

  it('sends the stored token as a bearer token', async () => {
    tokenStorage.save({ accessToken: 'token-123', expiresIn: 60 })
    const adapter = stubServer(200)

    await httpClient.get('/api/users/me')

    expect(adapter.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('sends no Authorization header when nobody is signed in', async () => {
    const adapter = stubServer(200)

    await httpClient.get('/api/users/me')

    expect(adapter.mock.calls[0][0].headers.get('Authorization')).toBeFalsy()
  })

  it('reports a 401 on a protected endpoint as an ended session, once', async () => {
    stubServer(401, { status: 401, message: 'Authentication required' })

    const failure = await httpClient.get('/api/users/me').catch((error) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(401)
    expect(failure.message).toBe('Authentication required')
    expect(onSessionEnded).toHaveBeenCalledTimes(1)
  })

  it('does not treat a 401 from login as an ended session (it just means wrong credentials)', async () => {
    stubServer(401, { status: 401, message: 'Invalid email or password' })

    const failure = await httpClient
      .post('/api/auth/login', {}, { skipUnauthorizedHandler: true })
      .catch((error) => error)

    expect(failure.status).toBe(401)
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('does not report other client errors as an ended session', async () => {
    stubServer(409, { status: 409, message: 'Email already registered' })

    const failure = await httpClient.post('/api/auth/register', {}).catch((error) => error)

    expect(failure.status).toBe(409)
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('turns a missing response (server down, no network) into an ApiError with status 0', async () => {
    httpClient.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
    }

    const failure = await httpClient.get('/api/users/me').catch((error) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(0)
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('stops notifying a listener once it has unregistered', async () => {
    stubServer(401)
    unsubscribe()

    await httpClient.get('/api/users/me').catch(() => {})

    expect(onSessionEnded).not.toHaveBeenCalled()
  })
})
