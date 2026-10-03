import { addDays } from '../src/lib/dates.js'

// The review rule of docs/api/learning.md (the Business model, scenarios 5 and 6), used by the mock API. The backend's
// ReviewScheduler implements the same rule.

/** A word is mastered once its interval reaches this many days. */
export const MASTERED_FROM_DAYS = 16
const MAX_INTERVAL_DAYS = 36_500

/**
 * Days until the next review after a rating, from k, the word's current interval (0 for a new word): "Chưa nhớ" 1,
 * "Nhớ mơ hồ" max(1, k), "Nhớ rõ" max(2, 2k).
 */
export function nextInterval(k, result) {
  if (result === 'FORGOT') return 1
  const next = result === 'VAGUE' ? Math.max(1, k) : Math.max(2, 2 * k)
  return Math.min(next, MAX_INTERVAL_DAYS)
}

/**
 * State of a word for one learner after a rating.
 * @param {{ status: string, intervalDays: number, reviewCount: number, firstLearnedAt: string } | undefined} previous
 *   undefined for a word never reviewed
 * @param {'FORGOT' | 'VAGUE' | 'REMEMBERED'} result
 * @param {string} today "YYYY-MM-DD" in Vietnam time
 * @param {Date} now
 */
export function applyReview(previous, result, today, now = new Date()) {
  const intervalDays = nextInterval(previous?.intervalDays ?? 0, result)
  return {
    status: intervalDays >= MASTERED_FROM_DAYS ? 'MASTERED' : 'LEARNING',
    intervalDays,
    lastReviewResult: result,
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    nextReviewAt: addDays(today, intervalDays),
    lastReviewedAt: now.toISOString(),
    firstLearnedAt: previous?.firstLearnedAt ?? now.toISOString(),
  }
}
