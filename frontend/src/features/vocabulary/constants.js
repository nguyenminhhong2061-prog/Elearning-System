/** learningStatus values as the API returns them (see docs/api/vocabulary.md). */
export const LEARNING_STATUS = Object.freeze({
  NEW: 'NEW',
  LEARNING: 'LEARNING',
  MASTERED: 'MASTERED',
})

/** A word counts as learned once it has been reviewed at least once (learning or mastered). */
export function isLearned(status) {
  return status === LEARNING_STATUS.LEARNING || status === LEARNING_STATUS.MASTERED
}

/** How well the learner remembered a card. Exactly three levels (decided 25/09/2026; see docs/api/learning.md). */
export const REVIEW_RESULT = Object.freeze({
  FORGOT: 'FORGOT',
  VAGUE: 'VAGUE',
  REMEMBERED: 'REMEMBERED',
})

/** The rating buttons, in the order shown, with their keyboard shortcut and colours. */
export const REVIEW_OPTIONS = Object.freeze([
  { value: REVIEW_RESULT.FORGOT, label: 'Chưa nhớ', shortcut: '1', button: 'bg-review-forgot', tag: 'danger' },
  { value: REVIEW_RESULT.VAGUE, label: 'Nhớ mơ hồ', shortcut: '2', button: 'bg-review-vague', tag: 'warning' },
  { value: REVIEW_RESULT.REMEMBERED, label: 'Nhớ rõ', shortcut: '3', button: 'bg-review-remembered', tag: 'success' },
])

export function reviewOption(result) {
  return REVIEW_OPTIONS.find((option) => option.value === result)
}

/**
 * Cards a topic or list session contains: every due word plus every word never studied, with no limit (docs/api/
 * learning.md version 2; "Học 30 từ →" in scenario 5).
 * @param {{ wordCount: number, learnedCount: number, dueCount: number }} counts
 */
export function studyableCount({ wordCount, learnedCount, dueCount }) {
  return dueCount + Math.max(0, wordCount - learnedCount)
}
