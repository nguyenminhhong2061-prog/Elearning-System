import { cx } from '@/lib/cx'

const SEGMENT = {
  true: 'bg-success-solid',
  false: 'bg-danger-solid',
  partial: 'bg-warning-solid',
  // A writing answer the AI has not graded yet (scenario 10, branch 7b): striped, so it reads as "not done".
  pending: 'bg-[repeating-linear-gradient(135deg,var(--color-warning-solid)_0_4px,var(--color-line)_4px_8px)]',
}

/**
 * One segment per question, as on the flashcard screen: answered questions turn green (right, or full points), red
 * (wrong, or no points) or amber (some points of a writing question); a writing answer not graded yet is striped; the
 * current question is teal, the rest grey.
 *
 * @param {{ outcomes: Array<boolean | 'partial' | 'pending' | undefined>, current: number }} props
 */
export function QuestionProgress({ outcomes, current }) {
  const answered = outcomes.filter((outcome) => outcome !== undefined).length
  const pending = outcomes.filter((outcome) => outcome === 'pending').length

  return (
    <div
      role="progressbar"
      aria-label="Tiến độ bài làm"
      aria-valuemin={0}
      aria-valuemax={outcomes.length}
      aria-valuenow={answered}
      aria-valuetext={`Đã trả lời ${answered} / ${outcomes.length} câu${pending ? `, ${pending} câu chưa chấm` : ''}`}
      className="flex gap-1.25"
    >
      {outcomes.map((outcome, index) => (
        <span
          key={index}
          title={outcome === 'pending' ? `Câu ${index + 1}: chưa chấm` : undefined}
          className={cx('h-1.5 flex-1 rounded-full', outcome === undefined ? (index === current ? 'bg-brand' : 'bg-line') : SEGMENT[outcome])}
        />
      ))}
    </div>
  )
}
