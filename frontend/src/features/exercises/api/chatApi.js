import { httpClient } from '@/api/httpClient'
import { AI_TIMEOUT_MS } from './exercisesApi'

// Calls of the AI assistant API (B4). The contract is in docs/api/chatbot.md.

/** @param {{ lessonId?: number | null, questionId?: number | null }} context */
export async function createChatSession({ lessonId = null, questionId = null } = {}) {
  const { data } = await httpClient.post('/api/chat/sessions', { lessonId, questionId })
  return data
}

/** Lists only the signed-in learner's sessions, newest activity first. */
export async function listChatSessions(page = 0) {
  const { data } = await httpClient.get('/api/chat/sessions', { params: { page } })
  return data
}

/** Returns one page of a session's messages, newest first. The backend checks ownership. */
export async function getChatMessages(sessionId, page = 0) {
  const { data } = await httpClient.get(`/api/chat/sessions/${sessionId}/messages`, { params: { page } })
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
