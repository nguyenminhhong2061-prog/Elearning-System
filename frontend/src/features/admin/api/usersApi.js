import { httpClient } from '@/api/httpClient'
import { compactParams } from '../utils/params'

// Calls of the admin user pages (scenario 25). The contract is docs/api/admin.md, "Người dùng".

/**
 * @param {{ q?: string, status?: string, level?: string, sort?: string, page?: number, size?: number }} filters
 * @returns {Promise<import('@/api/types').PageResponse<import('../types').AdminUserRow>>}
 */
export async function getUsers(filters) {
  const { data } = await httpClient.get('/api/admin/users', { params: compactParams(filters) })
  return data
}

/** @returns {Promise<{ total: number, active: number, locked: number }>} */
export async function getUsersSummary() {
  const { data } = await httpClient.get('/api/admin/users/summary')
  return data
}

/** @returns {Promise<import('../types').AdminUserDetail>} */
export async function getUser(id) {
  const { data } = await httpClient.get(`/api/admin/users/${id}`)
  return data
}

/** @param {number} id @param {'ACTIVE' | 'LOCKED'} status @returns {Promise<import('../types').AdminUserDetail>} */
export async function setUserStatus(id, status) {
  const { data } = await httpClient.patch(`/api/admin/users/${id}`, { status })
  return data
}
