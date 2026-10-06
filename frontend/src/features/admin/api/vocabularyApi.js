import { httpClient } from '@/api/httpClient'
import { compactParams } from '../utils/params'

// Calls of the admin vocabulary pages (scenarios 19–22): topics, words and media files. The contract is
// docs/api/admin.md, "Chủ đề và từ vựng". Adding, editing and deleting topics and words use the endpoints the
// vocabulary module already has (admin only).

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
  const { data } = await httpClient.get('/api/admin/vocabulary', { params: compactParams(filters) })
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

/** @returns {Promise<{ result: 'HIDDEN' | 'DELETED' }>} */
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
