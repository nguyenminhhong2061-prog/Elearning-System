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
