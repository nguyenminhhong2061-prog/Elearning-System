import { httpClient } from '@/api/httpClient'

// Calls of the progress API (module D, D1: the home page). The contract is in docs/api/progress.md.

/** Streak and all-time totals. @returns {Promise<import('../types').ProgressSummary>} */
export async function getProgressSummary() {
  const { data } = await httpClient.get('/api/progress/summary')
  return data
}

/**
 * Counts per period for the chart: 7 days, 12 weeks or 6 months, the last one current.
 * @param {import('../types').Period} period
 * @returns {Promise<import('../types').Activity>}
 */
export async function getActivity(period) {
  const { data } = await httpClient.get('/api/progress/activity', { params: { period } })
  return data
}

/** The latest comprehensive test, or null before the first one. @returns {Promise<import('../types').SkillResult | null>} */
export async function getSkills() {
  const { data } = await httpClient.get('/api/progress/skills')
  return data.latest
}

/** Every badge with the learner's progress, earned ones first. @returns {Promise<import('../types').Badge[]>} */
export async function getBadges() {
  const { data } = await httpClient.get('/api/progress/badges')
  return data
}

/** Adds minutes of real study to today. */
export async function recordStudyTime(minutes) {
  await httpClient.post('/api/progress/study-time', { minutes })
}
