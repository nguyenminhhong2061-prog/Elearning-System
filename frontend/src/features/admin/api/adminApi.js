import { httpClient } from '@/api/httpClient'

// Calls of the admin area (module E). The contract is in docs/api/admin.md; every endpoint needs an admin token.

/** Drops empty filters so the query string only carries what the admin chose. */
function query(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

// --- Overview ------------------------------------------------------------------------------------------------------

/** @param {{ from: string, to: string }} period @returns {Promise<import('../types').AdminStats>} */
export async function getStats({ from, to }) {
  const { data } = await httpClient.get('/api/admin/stats', { params: { from, to } })
  return data
}

// --- Topics and words (module A) -------------------------------------------------------------------------------------

/** @returns {Promise<import('../types').AdminTopic[]>} */
export async function getTopics() {
  const { data } = await httpClient.get('/api/admin/topics')
  return data
}

/** @param {{ name: string, description: string | null, imageUrl: string | null }} topic */
export async function createTopic(topic) {
  const { data } = await httpClient.post('/api/topics', topic)
  return data
}

export async function updateTopic(id, topic) {
  const { data } = await httpClient.put(`/api/topics/${id}`, topic)
  return data
}

export async function deleteTopic(id) {
  await httpClient.delete(`/api/topics/${id}`)
}

/**
 * @param {{ topicId?: number, q?: string, level?: string, missing?: string, page?: number, size?: number }} filters
 * @returns {Promise<import('@/api/types').PageResponse<import('../types').AdminWord>>}
 */
export async function getWords(filters) {
  const { data } = await httpClient.get('/api/admin/vocabulary', { params: query(filters) })
  return data
}

/** @param {import('../types').WordInput} word */
export async function createWord(word) {
  const { data } = await httpClient.post('/api/vocabulary', word)
  return data
}

export async function updateWord(id, word) {
  const { data } = await httpClient.put(`/api/vocabulary/${id}`, word)
  return data
}

/** @returns {Promise<{ result: 'ARCHIVED' | 'DELETED' }>} */
export async function deleteWord(id) {
  const { data } = await httpClient.delete(`/api/vocabulary/${id}`)
  return data
}

/**
 * Uploads an audio file or an image as it is (no multipart) and returns its public address.
 * @param {File} file @param {'AUDIO' | 'IMAGE'} kind @returns {Promise<{ url: string }>}
 */
export async function uploadMedia(file, kind) {
  const { data } = await httpClient.post('/api/admin/media', file, {
    params: { kind },
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    timeout: 60_000,
  })
  return data
}

// --- Games (module A) --------------------------------------------------------------------------------------------------

/** @returns {Promise<import('../types').AdminGames>} */
export async function getGames() {
  const { data } = await httpClient.get('/api/admin/games')
  return data
}

/** @param {number} id @param {{ enabled: boolean, timeLimitSeconds: number }} settings */
export async function updateGame(id, settings) {
  const { data } = await httpClient.put(`/api/admin/games/${id}`, settings)
  return data
}

/** @returns {Promise<{ addedWords: number, bank: import('../types').GameBank }>} */
export async function syncGameBank() {
  const { data } = await httpClient.post('/api/admin/games/sync')
  return data
}

// --- Lessons (module B) ----------------------------------------------------------------------------------------------

/** @returns {Promise<import('../types').AdminLessonSummary[]>} */
export async function getLessons() {
  const { data } = await httpClient.get('/api/admin/lessons')
  return data
}

/** @returns {Promise<import('../types').AdminLesson>} */
export async function getLesson(id) {
  const { data } = await httpClient.get(`/api/admin/lessons/${id}`)
  return data
}

export async function createLesson(lesson) {
  const { data } = await httpClient.post('/api/admin/lessons', lesson)
  return data
}

export async function updateLesson(id, lesson) {
  const { data } = await httpClient.put(`/api/admin/lessons/${id}`, lesson)
  return data
}

/** @returns {Promise<{ result: 'ARCHIVED' | 'DELETED' }>} */
export async function deleteLesson(id) {
  const { data } = await httpClient.delete(`/api/admin/lessons/${id}`)
  return data
}

// --- Tests (module C) ------------------------------------------------------------------------------------------------

/** @returns {Promise<import('../types').AdminTestSummary[]>} */
export async function getTests() {
  const { data } = await httpClient.get('/api/admin/tests')
  return data
}

/** @returns {Promise<import('../types').AdminTest>} */
export async function getTest(id) {
  const { data } = await httpClient.get(`/api/admin/tests/${id}`)
  return data
}

export async function createTest(test) {
  const { data } = await httpClient.post('/api/admin/tests', test)
  return data
}

export async function updateTest(id, test) {
  const { data } = await httpClient.put(`/api/admin/tests/${id}`, test)
  return data
}

/** @param {number} id @param {{ title: string, startDate: string, endDate: string }} copy */
export async function duplicateTest(id, copy) {
  const { data } = await httpClient.post(`/api/admin/tests/${id}/duplicate`, copy)
  return data
}

// --- Users (module user) ---------------------------------------------------------------------------------------------

/**
 * @param {{ q?: string, status?: string, level?: string, sort?: string, page?: number, size?: number }} filters
 * @returns {Promise<import('@/api/types').PageResponse<import('../types').AdminUserRow>>}
 */
export async function getUsers(filters) {
  const { data } = await httpClient.get('/api/admin/users', { params: query(filters) })
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
