/**
 * The line at the top of the chat panel saying what the assistant is asked about (scenario 13, step 3), for example
 * "Câu 2 – Thì hiện tại hoàn thành: I ___ this film before. Bạn chọn: saw (sai)".
 *
 * @param {object} parts
 * @param {string} [parts.unit] "Câu" or "Mục"
 * @param {number} parts.number position in the lesson, from 1
 * @param {string} parts.lessonTitle
 * @param {string} parts.prompt
 * @param {string | null} [parts.answer] what the learner gave, once checked
 * @param {boolean | null} [parts.correct]
 */
export function chatContextLabel({ unit = 'Câu', number, lessonTitle, prompt, answer = null, correct = null }) {
  const head = `${unit} ${number} – ${lessonTitle}: ${prompt}`
  if (!answer) return head
  const verdict = correct === null ? '' : correct ? ' (đúng)' : ' (sai)'
  return `${head} Bạn chọn: ${answer}${verdict}`
}

/** What the learner answered a question, as text: the picked option or the typed answer. */
export function answerText(question, choice) {
  if (!choice) return null
  if (question.type === 'FILL_BLANK') return choice.answer?.trim() || null
  return question.options.find((option) => option.id === choice.optionId)?.text ?? null
}
