import { cx } from '@/lib/cx'

/**
 * The design's green "✓ Chính xác!" box under a graded question, or its red counterpart with the right answer.
 * `children` adds an action below the explanation (asking the AI assistant).
 *
 * @param {{ correct: boolean, correctAnswer: string, explanation?: string | null, className?: string }} props
 */
export function AnswerFeedback({ correct, correctAnswer, explanation, className, children }) {
  return (
    <div
      className={cx(
        'flex flex-col gap-1.5 rounded-[10px] border p-3.5 text-sm',
        correct ? 'border-success-line bg-success-bg text-success' : 'border-danger-solid/30 bg-danger-bg text-danger',
        className,
      )}
    >
      <p className="font-semibold">
        {correct ? (
          '✓ Chính xác!'
        ) : (
          <>
            ✗ Chưa đúng. Đáp án đúng:{' '}
            <strong lang="en" className="font-bold">
              {correctAnswer}
            </strong>
          </>
        )}
      </p>
      {explanation && <p className="leading-relaxed text-ink-soft">{explanation}</p>}
      {children}
    </div>
  )
}
