import { cx } from '@/lib/cx'

/**
 * One segment per question, as on the flashcard screen: answered questions turn green or red, the current one is
 * teal, the rest grey.
 *
 * @param {{ outcomes: Array<boolean | undefined>, current: number }} props outcomes[i]: whether question i was right
 */
export function QuestionProgress({ outcomes, current }) {
  const answered = outcomes.filter((outcome) => outcome !== undefined).length

  return (
    <div
      role="progressbar"
      aria-label="Tiến độ bài làm"
      aria-valuemin={0}
      aria-valuemax={outcomes.length}
      aria-valuenow={answered}
      aria-valuetext={`Đã trả lời ${answered} / ${outcomes.length} câu`}
      className="flex gap-1.25"
    >
      {outcomes.map((outcome, index) => (
        <span
          key={index}
          className={cx(
            'h-1.5 flex-1 rounded-full',
            outcome === true && 'bg-success-solid',
            outcome === false && 'bg-danger-solid',
            outcome === undefined && (index === current ? 'bg-brand' : 'bg-line'),
          )}
        />
      ))}
    </div>
  )
}
