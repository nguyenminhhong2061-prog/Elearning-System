// Pure helpers of the writing exercise (scenario 10). Points come from the AI in steps of 0.5.

/** "1.0", "2.0", "1.5": the points of an answer always with one decimal, as the scenario writes "1.0/2". */
export const formatPoints = (value) => value.toFixed(1)

/** "2", "12", "9.5": a maximum or a total keeps its decimal only when it has one. */
export const formatTotal = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

/** "1.0/2" for a graded answer. */
export const scoreText = (result) => {
  const earned = result.maxPoints === 100 && Number.isInteger(result.awardedPoints)
    ? String(result.awardedPoints)
    : formatPoints(result.awardedPoints)
  return `${earned}/${formatTotal(result.maxPoints)}`
}

/**
 * How a writing answer shows on the progress bar: full points green, none red, some amber, not graded yet striped
 * (branch 7b, "Chưa chấm"), not answered yet nothing.
 * @param {import('../types').WritingResult | undefined} result
 */
export function writingOutcome(result) {
  if (!result) return undefined
  if (!result.graded) return 'pending'
  if (result.awardedPoints >= result.maxPoints) return true
  return result.awardedPoints === 0 ? false : 'partial'
}

/** Colour of a graded answer's box, by its share of the points. */
export function scoreTone(result) {
  if (result.awardedPoints >= result.maxPoints) return 'success'
  return result.awardedPoints === 0 ? 'danger' : 'warning'
}

/** The first sentence of the AI's feedback, for the review list ("tóm tắt nhận xét"). */
export function feedbackSummary(feedback) {
  if (!feedback) return null
  const [first] = feedback.split(/(?<=[.!?])\s+/)
  return first
}

/** The keywords of a KEYWORD_SENTENCE prompt ("luggage / heavy / carry"). */
export const keywordsOf = (prompt) =>
  prompt
    .split('/')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
