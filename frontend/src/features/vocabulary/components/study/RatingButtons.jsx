import { cx } from '@/lib/cx'
import { REVIEW_OPTIONS } from '../../constants'

/** The three self-assessment buttons (the design draws four; the module uses three levels). */
export function RatingButtons({ onRate, busy }) {
  return (
    <div role="group" aria-label="Bạn nhớ từ này đến đâu?" aria-busy={busy || undefined} className="grid grid-cols-3 gap-2">
      {REVIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={busy}
          aria-keyshortcuts={option.shortcut}
          onClick={() => onRate(option.value)}
          className={cx(
            'cursor-pointer rounded-lg px-1.5 py-3.25 text-label font-semibold text-white transition-opacity hover:opacity-90',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60',
            option.button,
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
