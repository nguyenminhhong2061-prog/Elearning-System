import { httpClient } from '@/api/httpClient'
import { AI_TIMEOUT_MS } from './exercisesApi'

// Calls of the AI assistant API (B4). The contract is in docs/api/chatbot.md.

/** @param {{ lessonId?: number | null, questionId?: number | null }} context */
export async function createChatSession({ lessonId = null, questionId = null } = {}) {
  const { data } = await httpClient.post('/api/chat/sessions', { lessonId, questionId })
  return data
}

/**
 * Sends the learner's message with the ids of what they are working on; the server looks the content up itself.
 * @param {number} sessionId
 * @param {{ content: string, questionId?: number | null, attemptId?: number | null, pronunciationItemId?: number | null }} message
 * @returns {Promise<import('../types').ChatReply>}
 */
export async function sendChatMessage(sessionId, { content, questionId = null, attemptId = null, pronunciationItemId = null }) {
  const { data } = await httpClient.post(
    `/api/chat/sessions/${sessionId}/messages`,
    { content, questionId, attemptId, pronunciationItemId },
    { timeout: AI_TIMEOUT_MS },
  )
  return data
}
