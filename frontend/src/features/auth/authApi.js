import { httpClient } from '@/api/httpClient'

// Login and register answer 401/409 for bad input, which must not be mistaken for an expired session
// (see httpClient.js), so they opt out of the global 401 handling.
const CREDENTIAL_REQUEST = { skipUnauthorizedHandler: true }

/**
 * POST /api/auth/register. Creates a learner account; no token is returned, so log in afterwards.
 * @param {{ fullName: string, email: string, password: string }} payload
 * @returns {Promise<import('@/api/types').User>}
 */
export async function register(payload) {
  const { data } = await httpClient.post('/api/auth/register', payload, CREDENTIAL_REQUEST)
  return data
}

/**
 * POST /api/auth/login.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<import('@/api/types').AuthToken>}
 */
export async function login(payload) {
  const { data } = await httpClient.post('/api/auth/login', payload, CREDENTIAL_REQUEST)
  return data
}

/**
 * POST /api/auth/change-password (204, no body). Rejects with status 400 when the current password is wrong.
 * @param {{ currentPassword: string, newPassword: string }} payload
 */
export async function changePassword(payload) {
  await httpClient.post('/api/auth/change-password', payload)
}

/**
 * GET /api/users/me.
 * @returns {Promise<import('@/api/types').User>}
 */
export async function getCurrentUser() {
  const { data } = await httpClient.get('/api/users/me')
  return data
}
