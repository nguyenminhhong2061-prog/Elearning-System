import { Link } from 'react-router'
import { paths } from '@/config/paths'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { useLearningSummary } from '../api/learningQueries'

/** Number of words due today, or 0 while unknown (loading, error): the reminder is simply not shown then. */
function useDueToday() {
  const summary = useLearningSummary()
  return summary.data?.dueToday ?? 0
}

/**
 * The design's "Từ cần ôn hôm nay" card (A2 reminder), for the home page. Hidden when nothing is due.
 * The progress dashboard (module D) can place it in its own layout.
 */
export function DueReviewCard({ className }) {
  const due = useDueToday()
  if (due === 0) return null

  return (
    <Link
      to={paths.review}
      aria-label={`Bạn có ${formatCount(due)} từ cần ôn hôm nay. Ôn tập ngay`}
      className={cx(
        'flex flex-col gap-0.5 rounded-xl border border-brand-tint-line bg-brand-tint p-5 transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      )}
    >
      <span className="text-label font-medium text-brand-dark">Từ cần ôn hôm nay</span>
      <span className="text-stat font-bold text-brand-dark">{formatCount(due)}</span>
      <span className="text-xs font-semibold text-brand-dark">Ôn tập ngay →</span>
    </Link>
  )
}

/** One-line version of the reminder for the vocabulary page. Hidden when nothing is due. */
export function DueReviewBanner() {
  const due = useDueToday()
  if (due === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-tint-line bg-brand-tint px-5 py-3.5">
      <p className="text-sm font-semibold text-brand-dark">Bạn có {formatCount(due)} từ cần ôn hôm nay</p>
      <Link
        to={paths.review}
        className="rounded-lg bg-brand px-4 py-2 text-label font-semibold text-white hover:bg-brand-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Ôn tập ngay →
      </Link>
    </div>
  )
}
