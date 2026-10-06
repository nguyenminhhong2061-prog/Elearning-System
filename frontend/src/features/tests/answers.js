// Pure helpers of the test-taking screen: what the learner has answered and what the server is sent.

/** A test question answered by picking one of its options (the others are typed or recorded). */
export const isChoice = (question) => question.options.length > 0

/** A speaking question answered by recording its reference sentence. */
export const isReadAloud = (question) => Boolean(question.referenceText)

/**
 * Whether the question has an answer the server would grade: a picked option, some text, or a saved recording.
 * @param {import('./types').TestQuestion} question
 * @param {{ optionId?: number | null, text?: string, recorded?: boolean } | undefined} answer
 */
export function isAnswered(question, answer) {
  if (isReadAloud(question)) return Boolean(answer?.recorded)
  return answerPayload(question, answer) !== null
}

/**
 * The body of PUT /api/test-attempts/{attemptId}/answers/{questionId}, or null when nothing usable was entered.
 * @param {import('./types').TestQuestion} question
 * @param {{ optionId?: number | null, text?: string } | undefined} answer
 * @returns {{ optionId: number } | { text: string } | null}
 */
export function answerPayload(question, answer) {
  if (!answer) return null
  if (isChoice(question)) {
    return answer.optionId != null ? { optionId: answer.optionId } : null
  }
  const text = (answer.text ?? '').trim()
  return text ? { text } : null
}

/**
 * Turns the answers returned when an attempt is resumed into the screen's answer map, keyed by question id.
 * @param {import('./types').SavedAnswer[]} saved
 */
export function answersFromSaved(saved) {
  const map = {}
  for (const item of saved) {
    if (item.recorded) map[item.questionId] = { recorded: true }
    else map[item.questionId] = item.optionId != null ? { optionId: item.optionId } : { text: item.text ?? '' }
  }
  return map
}

/** Questions without a usable answer, in test order. */
/**
 * The test's parts in order (scenario 15): consecutive questions of one skill, each with its position in the test.
 * @returns {Array<{ skill: string | null, items: Array<{ question: object, index: number }> }>}
 */
export function testParts(questions) {
  const parts = []
  questions.forEach((question, index) => {
    const skill = question.skill?.toLowerCase() ?? null
    const last = parts.at(-1)
    if (last && last.skill === skill) last.items.push({ question, index })
    else parts.push({ skill, items: [{ question, index }] })
  })
  return parts
}

export function unansweredQuestions(questions, answers) {
  return questions.filter((question) => !isAnswered(question, answers[question.id]))
}

/** Where a resumed attempt opens: the first unanswered question, or the last one when every question is answered. */
export function firstUnansweredIndex(questions, answers) {
  const index = questions.findIndex((question) => !isAnswered(question, answers[question.id]))
  return index === -1 ? Math.max(questions.length - 1, 0) : index
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * How long a test stays open, as the design's "Còn 2 ngày": null for a test without an end date.
 * @param {string | null} endDate ISO instant
 */
export function describeDeadline(endDate, now = new Date()) {
  if (!endDate) return null
  const left = new Date(endDate).getTime() - now.getTime()
  if (left <= 0) return 'Đã hết hạn'
  if (left < DAY_MS) return 'Hạn cuối hôm nay'
  return `Còn ${Math.floor(left / DAY_MS)} ngày`
}
