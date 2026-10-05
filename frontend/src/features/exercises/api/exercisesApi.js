import { httpClient } from '@/api/httpClient'

// Calls of the exercise API (module B). The contract is in docs/api/exercises.md.

/** Grading a recording goes through an AI service, which can take much longer than the default 15s. */
export const AI_TIMEOUT_MS = 60_000
// OpenPronounce downloads two model checkpoints the first time it assesses a recording.
export const PRONUNCIATION_TIMEOUT_MS = 600_000

// Until the backend follows the 02/10/2026 contract (grammar replaced by reading and writing), it still answers with
// the GRAMMAR skill and does not know READING or WRITING. A grammar lesson is a reading lesson without a passage
// (Business model), so it is shown as one; the writing tab is simply empty. Remove this once the backend has changed.
const LEGACY_SKILL = { GRAMMAR: 'READING' }
const withCurrentSkill = (lesson) => (LEGACY_SKILL[lesson.skill] ? { ...lesson, skill: LEGACY_SKILL[lesson.skill] } : lesson)

/**
 * @param {import('../types').Skill} skill
 * @returns {Promise<import('../types').LessonSummary[]>}
 */
export async function getLessons(skill) {
  try {
    const { data } = await httpClient.get('/api/exercises', { params: { skill } })
    return data.map(withCurrentSkill)
  } catch (error) {
    // 400: a backend that does not know this skill yet (see LEGACY_SKILL).
    if (error.status === 400 && skill === 'READING') return getLessons('GRAMMAR')
    if (error.status === 400 && skill === 'WRITING') return []
    throw error
  }
}

/** A lesson's content, without answers. @returns {Promise<import('../types').Lesson>} */
export async function getLesson(lessonId) {
  const { data } = await httpClient.get(`/api/exercises/${lessonId}`)
  return withCurrentSkill(data)
}

/**
 * Opens a lesson: the server picks up the learner's unfinished attempt (reading, writing, pronunciation) when it can,
 * or starts a new one. `restart` always starts a new one ("Làm lại từ đầu").
 * @returns {Promise<import('../types').AttemptStart>}
 */
export async function startAttempt(lessonId, { restart = false } = {}) {
  const { data } = await httpClient.post(`/api/exercises/${lessonId}/attempts`, null, restart ? { params: { restart: true } } : undefined)
  return data
}

/** The unfinished attempt the learner worked on last, for "Tiếp tục" on the home page. @returns {Promise<import('../types').CurrentAttempt | null>} */
export async function getCurrentAttempt() {
  const { data } = await httpClient.get('/api/exercise-attempts/current')
  return data.current && { ...data.current, lesson: withCurrentSkill(data.current.lesson) }
}

/**
 * Answers one question and gets it graded right away (reading).
 * @param {number} attemptId
 * @param {import('../types').ResponseInput} response
 * @returns {Promise<import('../types').ResponseResult>}
 */
export async function answerQuestion(attemptId, response) {
  const { data } = await httpClient.post(`/api/exercise-attempts/${attemptId}/responses`, response)
  return data
}

/**
 * Sends one writing answer: the server saves it, then the AI grades it (scenario 10, steps 5 to 8). When the AI fails
 * the answer stays saved with `graded: false`.
 * @param {number} attemptId
 * @param {{ questionId: number, answer: string }} response
 * @returns {Promise<import('../types').WritingResult>}
 */
export async function answerWriting(attemptId, response) {
  const { data } = await httpClient.post(`/api/exercise-attempts/${attemptId}/responses`, response, { timeout: AI_TIMEOUT_MS })
  return data
}

/**
 * Sends a saved writing answer to the AI again ("Gửi chấm lại", branches 7b and 14a).
 * @returns {Promise<import('../types').WritingResult>}
 */
export async function regradeWriting(attemptId, questionId) {
  const { data } = await httpClient.post(`/api/exercise-attempts/${attemptId}/responses/${questionId}/grade`, null, { timeout: AI_TIMEOUT_MS })
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
    timeout: PRONUNCIATION_TIMEOUT_MS,
  })
  return data
}
