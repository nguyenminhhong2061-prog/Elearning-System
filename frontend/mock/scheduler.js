import { addDays } from '../src/lib/dates.js'

// The spaced-repetition rule of docs/api/learning.md, used by the mock API. The backend implements the same table.

/** Days until the next review for steps 0..4. */
export const INTERVALS = [1, 3, 7, 14, 30]
const LAST_STEP = INTERVALS.length - 1

/**
 * State of a word for one learner after a rating.
 * @param {{ status: string, step: number, reviewCount: number, firstLearnedAt: string } | undefined} previous
 *   undefined for a word never reviewed
 * @param {'FORGOT' | 'VAGUE' | 'REMEMBERED'} result
 * @param {string} today "YYYY-MM-DD" in Vietnam time
 * @param {Date} now
 */
export function applyReview(previous, result, today, now = new Date()) {
  const isNew = previous === undefined
  let step
  if (result === 'FORGOT') step = 0
  else if (result === 'VAGUE') step = isNew ? 0 : previous.step
  else step = isNew ? 1 : Math.min(previous.step + 1, LAST_STEP)

  return {
    status: result === 'REMEMBERED' && step === LAST_STEP ? 'MASTERED' : 'LEARNING',
    step,
    lastReviewResult: result,
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    nextReviewAt: addDays(today, INTERVALS[step]),
    lastReviewedAt: now.toISOString(),
    firstLearnedAt: previous?.firstLearnedAt ?? now.toISOString(),
  }
}
