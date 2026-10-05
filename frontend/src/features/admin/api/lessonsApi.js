import { httpClient } from '@/api/httpClient'

// Calls of the admin exercise pages (scenario 23). The contract is docs/api/admin.md, "Bài tập" (module B).

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

/** @returns {Promise<{ result: 'HIDDEN' | 'DELETED' }>} */
export async function deleteLesson(id) {
  const { data } = await httpClient.delete(`/api/admin/lessons/${id}`)
  return data
}
