import { LEARNING_STATUS, REVIEW_OPTIONS } from '../constants'

/** A word counts as learned once it has been reviewed at least once (learning or mastered). */
export function isLearned(status) {
  return status === LEARNING_STATUS.LEARNING || status === LEARNING_STATUS.MASTERED
}

/** The rating button of a review result (label, colours), or undefined. */
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
