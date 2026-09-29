import { httpClient } from '@/api/httpClient'

// Calls of the study plan API (module D, D2). The contract is in docs/api/plans.md.

/** Writing the weekly plan may involve the AI: wait as long as the exercise assistant does. */
const PREVIEW_TIMEOUT_MS = 60_000

/** @returns {Promise<{ plan: import('../types').StudyPlan | null, goalOptions: import('../types').GoalOption[] }>} */
export async function getStudyPlan() {
  const { data } = await httpClient.get('/api/study-plan')
  return data
}

/**
 * The AI's weekly plan for a goal, not saved.
 * @param {{ targetLevel: string, months: number, note: string | null }} goal
 * @returns {Promise<import('../types').PlanDraft>}
 */
export async function previewPlan(goal) {
  const { data } = await httpClient.post('/api/study-plan/preview', goal, { timeout: PREVIEW_TIMEOUT_MS })
  return data
}

/**
 * Saves the previewed plan as the learner's plan, replacing the previous one.
 * @param {import('../types').PlanDraft} draft
 * @returns {Promise<import('../types').StudyPlan>}
 */
export async function createPlan(draft) {
  const { data } = await httpClient.post('/api/study-plan', {
    targetLevel: draft.goal.targetLevel,
    months: draft.goal.months,
    note: draft.goal.note,
    summary: draft.summary,
    weeks: draft.weeks.map(({ weekNumber, description, targetWords, targetExercises }) => ({
      weekNumber,
      description,
      targetWords,
      targetExercises,
    })),
  })
  return data
}

/** @param {'ACTIVE' | 'PAUSED'} status @returns {Promise<import('../types').StudyPlan>} */
export async function changePlanStatus(status) {
  const { data } = await httpClient.patch('/api/study-plan', { status })
  return data
}

/** @returns {Promise<{ items: import('../types').Suggestion[] }>} */
export async function getSuggestions() {
  const { data } = await httpClient.get('/api/study-plan/suggestions')
  return data
}

/** @returns {Promise<import('../types').ReminderSetting>} */
export async function getReminder() {
  const { data } = await httpClient.get('/api/study-plan/reminder')
  return data
}

/** @param {import('../types').ReminderSetting} setting @returns {Promise<import('../types').ReminderSetting>} */
export async function saveReminder(setting) {
  const { data } = await httpClient.put('/api/study-plan/reminder', setting)
  return data
}
