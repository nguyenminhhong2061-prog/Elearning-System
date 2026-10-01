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
 * @param {import('../types').GoalRequest} goal
 * @returns {Promise<import('../types').PlanDraft>}
 */
export async function previewPlan(goal) {
  const { data } = await httpClient.post('/api/study-plan/preview', goal, { timeout: PREVIEW_TIMEOUT_MS })
  return data
}

const scheduleOf = (weeks) =>
  weeks.map(({ weekNumber, description, targetWords, targetExercises }) => ({ weekNumber, description, targetWords, targetExercises }))

/**
 * Saves the previewed plan, with the learner's changes to the weekly targets, as their active plan; an active plan
 * they already had is paused.
 * @param {import('../types').PlanDraft} draft
 * @returns {Promise<import('../types').StudyPlan>}
 */
export async function createPlan(draft) {
  const { data } = await httpClient.post('/api/study-plan', {
    targetLevel: draft.goal.targetLevel,
    startDate: draft.startDate,
    endDate: draft.endDate,
    description: draft.goal.description,
    summary: draft.summary,
    weeks: scheduleOf(draft.weeks),
  })
  return data
}

/**
 * Scenario 18: new targets for the weeks not over yet, and maybe a new end date (weeks are added or dropped).
 * @param {{ endDate: string, weeks: import('../types').PlanWeek[] }} change
 * @returns {Promise<import('../types').StudyPlan>}
 */
export async function updateSchedule({ endDate, weeks }) {
  const { data } = await httpClient.put('/api/study-plan/schedule', { endDate, weeks: scheduleOf(weeks) })
  return data
}

/**
 * Pause, resume, or end the plan (COMPLETED: it is no longer the learner's plan).
 * @param {'ACTIVE' | 'PAUSED' | 'COMPLETED'} status
 * @returns {Promise<import('../types').StudyPlan>}
 */
export async function changePlanStatus(status) {
  const { data } = await httpClient.patch('/api/study-plan', { status })
  return data
}

/** @returns {Promise<{ items: import('../types').Suggestion[] }>} */
export async function getSuggestions() {
  const { data } = await httpClient.get('/api/study-plan/suggestions')
  return data
}
