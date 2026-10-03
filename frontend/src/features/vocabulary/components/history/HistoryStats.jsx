import { Link } from 'react-router'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/paths'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { HISTORY_FILTERS } from '../../constants'
import { DueReviewCard } from '../DueReview'

const STATS_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4'
const STAT_CARD = 'flex flex-col gap-0.5 rounded-xl border bg-white p-5'

function StatCard({ label, value }) {
  return (
    <div className={cx(STAT_CARD, 'border-line')}>
      <span className="text-label font-medium text-muted">{label}</span>
      <span className="text-stat font-bold text-ink">{formatCount(value)}</span>
    </div>
  )
}

/** A statistic that lists its words below when chosen; choosing it again goes back to every reviewed word. */
function FilterCard({ id, value, chosen }) {
  const { label } = HISTORY_FILTERS[id]

  return (
    <Link
      to={paths.vocabularyHistory(chosen ? null : id)}
      aria-current={chosen ? 'true' : undefined}
      aria-label={`${label}: ${formatCount(value)} từ. ${chosen ? 'Bỏ chọn' : 'Xem danh sách'}`}
      className={cx(
        STAT_CARD,
        'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        chosen ? 'border-brand ring-1 ring-brand' : 'border-line hover:border-brand',
      )}
    >
      <span className="text-label font-medium text-muted">{label}</span>
      <span className="text-stat font-bold text-ink">{formatCount(value)}</span>
      <span className="text-xs font-semibold text-brand-dark">{chosen ? 'Bỏ chọn ✕' : 'Xem danh sách →'}</span>
    </Link>
  )
}

/**
 * The four counts at the top of the history tab: due today (a link to the review session when there is something to
 * review), then learning, mastered and reviewed today, which show their words when chosen.
 *
 * @param {object} props
 * @param {import('@tanstack/react-query').UseQueryResult} props.summary useLearningSummary()
 * @param {string | null} props.chosen id of the chosen statistic (a key of HISTORY_FILTERS)
 */
export function HistoryStats({ summary, chosen }) {
  if (summary.isPending) {
    return (
      <div className={STATS_GRID}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-29.5 rounded-xl" />
        ))}
      </div>
    )
  }
  if (summary.isError) {
    return <LoadError error={summary.error} onRetry={() => summary.refetch()} message="Không tải được thống kê." />
  }

  const { dueToday, learningCount, masteredCount, reviewedToday } = summary.data
  const counts = { learning: learningCount, mastered: masteredCount, today: reviewedToday }
  return (
    <div className={STATS_GRID}>
      {dueToday > 0 ? <DueReviewCard /> : <StatCard label="Cần ôn hôm nay" value={0} />}
      {Object.keys(HISTORY_FILTERS).map((id) => (
        <FilterCard key={id} id={id} value={counts[id]} chosen={id === chosen} />
      ))}
    </div>
  )
}
