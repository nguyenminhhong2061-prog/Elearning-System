import { httpClient } from '@/api/httpClient'

// Calls of the exercise API (module B). The contract is in docs/api/exercises.md.

/** Grading a recording goes through an AI service, which can take much longer than the default 15s. */
export const AI_TIMEOUT_MS = 60_000

/**
 * @param {import('../types').Skill} skill
 * @returns {Promise<import('../types').LessonSummary[]>}
 */
export async function getLessons(skill) {
  const { data } = await httpClient.get('/api/exercises', { params: { skill } })
  return data
}

/** A lesson's content, without answers. @returns {Promise<import('../types').Lesson>} */
export async function getLesson(lessonId) {
  const { data } = await httpClient.get(`/api/exercises/${lessonId}`)
  return data
}

/**
 * Opens a lesson: the server picks up the learner's unfinished attempt (grammar, pronunciation) when it can, or starts a
 * new one. `restart` always starts a new one ("Làm lại từ đầu").
 * @returns {Promise<import('../types').AttemptStart>}
 */
export async function startAttempt(lessonId, { restart = false } = {}) {
  const { data } = await httpClient.post(`/api/exercises/${lessonId}/attempts`, null, restart ? { params: { restart: true } } : undefined)
  return data
}

/** The unfinished attempt the learner worked on last, for "Tiếp tục" on the home page. @returns {Promise<import('../types').CurrentAttempt | null>} */
export async function getCurrentAttempt() {
  const { data } = await httpClient.get('/api/exercise-attempts/current')
  return data.current
}

/**
 * Answers one question and gets it graded right away (grammar).
 * @param {number} attemptId
 * @param {import('../types').ResponseInput} response
 * @returns {Promise<import('../types').ResponseResult>}
 */
export async function answerQuestion(attemptId, response) {
  const { data } = await httpClient.post(`/api/exercise-attempts/${attemptId}/responses`, response)
  return data
}

/**
 * Ends the attempt. `responses` carries the answers not sent one by one (the whole listening test).
 * @param {number} attemptId
 * @param {{ responses?: import('../types').ResponseInput[], playbackRate?: number }} [body]
 * @returns {Promise<import('../types').AttemptResult>}
 */
export async function completeAttempt(attemptId, { responses = [], playbackRate } = {}) {
  const { data } = await httpClient.post(`/api/exercise-attempts/${attemptId}/complete`, { responses, playbackRate })
  return data
}

/**
 * Sends one recording (WAV, 16 kHz mono) to be graded.
 * @param {number} attemptId
 * @param {number} itemId
 * @param {Blob} wav
 * @returns {Promise<import('../types').PronunciationAssessment>}
 */
export async function assessPronunciation(attemptId, itemId, wav) {
  const { data } = await httpClient.post(`/api/exercise-attempts/${attemptId}/pronunciation/${itemId}`, wav, {
    headers: { 'Content-Type': 'audio/wav' },
    timeout: AI_TIMEOUT_MS,
  })
  return data
}
