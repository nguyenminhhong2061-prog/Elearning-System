/** What the learner answered, as text: the chosen option, the typed answer, or nothing. */
function answerText(question, item) {
  if (item.answer) return item.answer
  if (item.optionId !== null) return question?.options.find((option) => option.id === item.optionId)?.text ?? null
  return null
}

/**
 * Below the result: the questions answered wrongly, with the right answer and the explanation, so the learner can
 * go over them once more.
 *
 * @param {object} props
 * @param {import('../types').Lesson} props.lesson
 * @param {import('../types').ReviewItem[]} props.review
 * @param {(questionId: number) => void} props.onAsk opens the AI assistant about that question
 */
export function GrammarReview({ lesson, review, onAsk }) {
  const wrong = review.filter((item) => !item.correct)
  if (wrong.length === 0) return null
  const questions = new Map(lesson.questions.map((question) => [question.id, question]))

  return (
    <section aria-labelledby="review-title" className="flex flex-col gap-3">
      <h2 id="review-title" className="text-base font-semibold text-ink">
        Câu cần xem lại ({wrong.length})
      </h2>
      <ol className="flex flex-col gap-2.5">
        {wrong.map((item) => {
          const question = questions.get(item.questionId)
          const given = answerText(question, item)
          return (
            <li key={item.questionId} className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-white p-4 text-sm">
              <p lang="en" className="font-semibold text-ink">
                {question?.prompt}
              </p>
              <p className="text-danger">
                Bạn trả lời: {given ? <span lang="en">{given}</span> : <em>chưa trả lời</em>}
              </p>
              <p className="text-success">
                Đáp án đúng: <strong lang="en">{item.correctAnswer}</strong>
              </p>
              {item.explanation && <p className="leading-relaxed text-ink-soft">{item.explanation}</p>}
              <button
                type="button"
                onClick={() => onAsk(item.questionId)}
                className="cursor-pointer self-start text-label font-semibold text-brand-dark hover:text-brand"
              >
                Hỏi trợ lý AI về câu này →
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
