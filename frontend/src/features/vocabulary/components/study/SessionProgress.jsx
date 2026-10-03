import { cx } from '@/lib/cx'
import { reviewOption } from '../../utils/learning'

// Segment colours: answered cards take the colour of their rating, the current card is teal, the rest are grey.
const RESULT_SEGMENT = {
  FORGOT: 'bg-review-forgot',
  VAGUE: 'bg-review-vague',
  REMEMBERED: 'bg-review-remembered',
}

/**
 * Top row of the design's flashcard screen: one segment per card, "3/20", and "Kết thúc", which ends the session and
 * shows its summary (scenario 5, step 13).
 * @param {{ results: string[], total: number, onFinish: () => void }} props
 */
export function SessionProgress({ results, total, onFinish }) {
  const current = Math.min(results.length + 1, total)

  return (
    <div className="flex items-center gap-3.5">
      <div
        role="progressbar"
        aria-label="Tiến độ phiên học"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={results.length}
        aria-valuetext={`Đã đánh giá ${results.length} / ${total} thẻ`}
        className="flex flex-1 gap-1.25"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            title={index < results.length ? reviewOption(results[index])?.label : undefined}
            className={cx(
              'h-1.5 flex-1 rounded-full',
              index < results.length ? RESULT_SEGMENT[results[index]] : index === results.length ? 'bg-brand' : 'bg-line',
            )}
          />
        ))}
      </div>
      <span className="font-mono text-label font-semibold text-ink-soft">
        {current}/{total}
      </span>
      <button
        type="button"
        onClick={onFinish}
        title="Kết thúc phiên học (các thẻ đã đánh giá vẫn được lưu)"
        className="flex-none cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-label font-semibold text-ink-soft hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand"
      >
        Kết thúc
      </button>
    </div>
  )
}
