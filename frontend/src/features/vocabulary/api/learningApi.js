import { httpClient } from '@/api/httpClient'

// Calls of the flashcard and review API. The contract is in docs/api/learning.md.

/**
 * GET /api/learning/session. Pass topicId or listId; neither means "every word due today".
 * @param {{ topicId?: number, listId?: number }} source
 * @returns {Promise<{ source: { type: 'TOPIC' | 'LIST' | 'DUE', id: number | null, name: string | null },
 *   cards: import('../types').LearningCard[] }>}
 */
export async function getStudySession({ topicId, listId } = {}) {
  const { data } = await httpClient.get('/api/learning/session', { params: { topicId, listId } })
  return data
}

/**
 * POST /api/learning/reviews: saves the rating of one card immediately.
 * @param {{ vocabularyId: number, result: 'FORGOT' | 'VAGUE' | 'REMEMBERED' }} review
 */
export async function submitReview({ vocabularyId, result }) {
  const { data } = await httpClient.post('/api/learning/reviews', { vocabularyId, result })
  return data
}

/** GET /api/learning/summary: due today, counts and the next 7 days. */
export async function getLearningSummary() {
  const { data } = await httpClient.get('/api/learning/summary')
  return data
}

/**
 * GET /api/learning/history: words reviewed at least once, latest first, optionally only those of one status or
 * reviewed today.
 * @param {{ page?: number, size?: number, status?: 'LEARNING' | 'MASTERED', reviewedToday?: boolean }} [query]
 */
export async function getLearningHistory({ page = 0, size = 20, status, reviewedToday } = {}) {
  const { data } = await httpClient.get('/api/learning/history', { params: { page, size, status, reviewedToday } })
  return data
}
