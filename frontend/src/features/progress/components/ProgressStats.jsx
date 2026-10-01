import { Skeleton } from '@/components/ui/Skeleton'
import { useLearningSummary } from '@/features/vocabulary/api/learningQueries'
import { DueReviewCard } from '@/features/vocabulary/components/DueReview'
import { formatCount } from '@/features/vocabulary/topicProgress'
import { cx } from '@/lib/cx'
import { useProgressSummary } from '../api/progressQueries'

/** A number while loading is unknown (skeleton); after a failed load it is shown as "—". */
function shown(query, value) {
  if (query.data) return value(query.data)
  return query.isError ? '—' : undefined
}

function StatCard({ label, value, caption, valueClassName }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-white p-4 sm:p-5">
      <span className="text-label font-medium text-muted">{label}</span>
      {value === undefined ? (
        <Skeleton className="my-1 h-8 w-16" />
      ) : (
        <span className={cx('text-stat font-bold text-ink', valueClassName)}>{value}</span>
      )}
      {caption && <span className="text-xs text-muted">{caption}</span>}
    </div>
  )
}

/** Scenario 16: the average sits under the count; it may be missing while the backend does not send it yet. */
function testsCaption({ testsCompleted, averageTestScore }) {
  if (testsCompleted === 0) return 'Chưa làm bài kiểm tra nào'
  return averageTestScore == null ? 'Định kỳ và tổng hợp' : `Điểm trung bình ${averageTestScore}/100`
}

function streakCaption({ current, activeToday }) {
  if (activeToday) return 'Hôm nay đã học, chuỗi được giữ'
  return current > 0 ? `Học hôm nay để giữ chuỗi ${current} ngày` : 'Học hôm nay để bắt đầu chuỗi'
}

/**
 * The five cards at the top of the home page. Word counts come from the vocabulary module (the same numbers as the
 * Từ vựng page), exercises and the streak from the progress module.
 */
export function ProgressStats() {
  const learning = useLearningSummary()
  const progress = useProgressSummary()
  const summary = learning.data
  const streak = progress.data?.streak

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-5">
      <StatCard
        label="Từ đã học"
        value={shown(learning, (data) => formatCount(data.learningCount + data.masteredCount))}
        caption={summary && `Đang học ${formatCount(summary.learningCount)} · Đã thuộc ${formatCount(summary.masteredCount)}`}
      />
      <StatCard
        label="Bài tập đã hoàn thành"
        value={shown(progress, (data) => formatCount(data.totals.exercisesCompleted))}
        caption="Ngữ pháp, nghe hiểu, phát âm"
      />
      <StatCard
        label="Bài kiểm tra đã làm"
        value={shown(progress, (data) => formatCount(data.totals.testsCompleted))}
        caption={progress.data && testsCaption(progress.data.totals)}
      />
      <StatCard
        label="Streak"
        value={shown(progress, (data) => `${data.streak.current} ngày`)}
        valueClassName={streak?.current ? 'text-streak' : undefined}
        caption={streak && streakCaption(streak)}
      />
      {summary?.dueToday > 0 ? (
        <DueReviewCard />
      ) : (
        <StatCard label="Từ cần ôn hôm nay" value={shown(learning, () => 0)} caption="Từ đã học sẽ đến hạn ôn ở đây" />
      )}
    </div>
  )
}
