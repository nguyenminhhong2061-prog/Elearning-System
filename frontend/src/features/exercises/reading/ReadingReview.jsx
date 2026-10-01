import { cx } from '@/lib/cx'

/** What the learner answered, as text: the chosen option, the typed answer, or nothing. */
function answerText(question, item) {
  if (item.answer) return item.answer
  if (item.optionId !== null) return question?.options.find((option) => option.id === item.optionId)?.text ?? null
  return null
}

/**
 * Below the result (scenario 9, step 16): every question in order with what the learner answered, the right answer and
 * the explanation, so they can go over the lesson once more and ask the assistant about any question.
 *
 * @param {object} props
 * @param {import('../types').Lesson} props.lesson
 * @param {import('../types').ReviewItem[]} props.review
 * @param {(questionId: number) => void} props.onAsk opens the AI assistant about that question
 */
export function ReadingReview({ lesson, review, onAsk }) {
  const questions = new Map(lesson.questions.map((question) => [question.id, question]))
  const right = review.filter((item) => item.correct).length

  return (
    <section aria-labelledby="review-title" className="flex flex-col gap-3">
      <h2 id="review-title" className="text-base font-semibold text-ink">
        Xem lại từng câu · đúng {right}/{review.length}
      </h2>
      <ol className="flex flex-col gap-2.5">
        {review.map((item, index) => {
          const question = questions.get(item.questionId)
          const given = answerText(question, item)
          return (
            <li
              key={item.questionId}
              className={cx('flex flex-col gap-1.5 rounded-[10px] border bg-white p-4 text-sm', item.correct ? 'border-line' : 'border-danger-solid/40')}
            >
              <p className="text-xs font-semibold text-muted">
                Câu {index + 1} · <span className={item.correct ? 'text-success' : 'text-danger'}>{item.correct ? '✓ Đúng' : '✗ Sai'}</span>
              </p>
              <p lang="en" className="font-semibold text-ink">
                {question?.prompt}
              </p>
              <p className={item.correct ? 'text-ink-soft' : 'text-danger'}>
                Bạn trả lời: {given ? <span lang="en">{given}</span> : <em>chưa trả lời</em>}
              </p>
              {!item.correct && (
                <p className="text-success">
                  Đáp án đúng: <strong lang="en">{item.correctAnswer}</strong>
                </p>
              )}
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
