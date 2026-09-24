import { httpClient } from '@/api/httpClient'

// Calls of the vocabulary API. The contract is in docs/api/vocabulary.md.

/** GET /api/topics: every topic with its word and learned counts. @returns {Promise<import('../types').Topic[]>} */
export async function getTopics() {
  const { data } = await httpClient.get('/api/topics')
  return data
}

/** GET /api/topics/{id}. Rejects with status 404 when it does not exist. @returns {Promise<import('../types').Topic>} */
export async function getTopic(id) {
  const { data } = await httpClient.get(`/api/topics/${id}`)
  return data
}

/**
 * GET /api/vocabulary, one page. Omitted filters are not sent.
 * @param {{ topicId?: number, q?: string, level?: string, page?: number, size?: number }} [filters]
 * @returns {Promise<import('@/api/types').PageResponse<import('../types').VocabularyItem>>}
 */
export async function getVocabularyPage({ topicId, q, level, page = 0, size = 20 } = {}) {
  const { data } = await httpClient.get('/api/vocabulary', {
    params: { topicId, q: q || undefined, level, page, size },
  })
  return data
}
