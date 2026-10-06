import { httpClient } from '@/api/httpClient'
import { RECORDING_UPLOAD_TIMEOUT_MS } from '../constants'

// Calls of the tests API. The contract is in docs/api/tests.md.

/** GET /api/tests: every open test with the current learner's progress. @returns {Promise<import('../types').TestSummary[]>} */
export async function getTests() {
  const { data } = await httpClient.get('/api/tests')
  return data
}

/** GET /api/tests/{id}. Rejects with status 404 when it does not exist or is closed. @returns {Promise<import('../types').TestDetail>} */
export async function getTest(id) {
  const { data } = await httpClient.get(`/api/tests/${id}`)
  return data
}

/**
 * GET /api/tests/{id}/attempts: the learner's submitted attempts at the test, newest first.
 * @returns {Promise<import('../types').AttemptSummary[]>}
 */
export async function getTestAttempts(testId) {
  const { data } = await httpClient.get(`/api/tests/${testId}/attempts`)
  return data
}

/**
 * POST /api/tests/{id}/attempts: starts or resumes an attempt.
 * @param {number} testId
 * @param {{ restart?: boolean }} [options]
 * Rejects with status 409 when the test is taken only once and the learner has already submitted it.
 * @returns {Promise<{ attemptId: number, resumed: boolean, status: import('../types').TestAttemptStatus, answers: import('../types').SavedAnswer[], passagePlays: import('../types').PassagePlay[] }>}
 */
export async function startAttempt(testId, { restart = false } = {}) {
  const { data } = await httpClient.post(`/api/tests/${testId}/attempts`, null, { params: { restart } })
  return data
}

/**
 * PUT /api/test-attempts/{attemptId}/answers/{questionId}: saves one answer.
 * @param {number} attemptId
 * @param {number} questionId
 * @param {{ optionId?: number | null, text?: string | null }} answer exactly one of optionId / text
 */
export async function saveAnswer(attemptId, questionId, answer) {
  await httpClient.put(`/api/test-attempts/${attemptId}/answers/${questionId}`, answer)
}

/**
 * PUT /api/test-attempts/{attemptId}/answers/{questionId}/recording: the recorded answer of a read-aloud question, a
 * WAV file. The server assesses it before answering, which can take a while. Rejects with status 503 when the
 * pronunciation service cannot assess now (nothing is saved), 409 when the attempt is already submitted.
 * @param {number} attemptId
 * @param {number} questionId
 * @param {Blob} wav
 */
export async function saveRecording(attemptId, questionId, wav) {
  await httpClient.put(`/api/test-attempts/${attemptId}/answers/${questionId}/recording`, wav, {
    headers: { 'Content-Type': 'audio/wav' },
    timeout: RECORDING_UPLOAD_TIMEOUT_MS,
  })
}

/**
 * POST /api/test-attempts/{attemptId}/passages/{passageId}/plays: counts one play of a recording, asked before each
 * play. Rejects with status 409 when the attempt has no play of it left.
 * @returns {Promise<import('../types').PassagePlay>}
 */
export async function recordPassagePlay(attemptId, passageId) {
  const { data } = await httpClient.post(`/api/test-attempts/${attemptId}/passages/${passageId}/plays`)
  return data
}

/** POST /api/test-attempts/{attemptId}/submit. @returns {Promise<import('../types').TestResult>} */
export async function submitAttempt(attemptId) {
  const { data } = await httpClient.post(`/api/test-attempts/${attemptId}/submit`)
  return data
}

/** GET /api/test-attempts/{attemptId}. Rejects with status 409 while the attempt is not submitted. @returns {Promise<import('../types').TestResult>} */
export async function getAttemptResult(attemptId) {
  const { data } = await httpClient.get(`/api/test-attempts/${attemptId}`)
  return data
}
