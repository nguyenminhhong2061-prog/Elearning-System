/**
 * The line at the top of the chat panel saying what the assistant is asked about (scenario 13, step 3), for example
 * "Câu 2 – Thì hiện tại hoàn thành: I ___ this film before. Bạn chọn: saw (sai)", or for a writing question
 * "Câu 1 – Viết về chuyến đi: Tôi đã đặt phòng… Bạn viết: I booked… (1.0/2 điểm)".
 *
 * @param {object} parts
 * @param {string} [parts.unit] "Câu" or "Mục"
 * @param {number} parts.number position in the lesson, from 1
 * @param {string} parts.lessonTitle
 * @param {string} parts.prompt
 * @param {string | null} [parts.answer] what the learner gave, once checked
 * @param {boolean | null} [parts.correct]
 * @param {string} [parts.answerLabel] "Bạn chọn" (default) or "Bạn viết"
 * @param {string | null} [parts.score] replaces the right/wrong verdict, for example "1.0/2 điểm"
 */
export function chatContextLabel({ unit = 'Câu', number, lessonTitle, prompt, answer = null, correct = null, answerLabel = 'Bạn chọn', score = null }) {
  const head = `${unit} ${number} – ${lessonTitle}: ${prompt}`
  if (!answer) return head
  let verdict = ''
  if (score) verdict = ` (${score})`
  else if (correct !== null) verdict = correct ? ' (đúng)' : ' (sai)'
  return `${head} ${answerLabel}: ${answer}${verdict}`
}

/** What the learner answered a question, as text: the picked option or the typed answer. */
export function answerText(question, choice) {
  if (!choice) return null
  if (question.type !== 'MULTIPLE_CHOICE') return choice.answer?.trim() || null
  return question.options.find((option) => option.id === choice.optionId)?.text ?? null
}
