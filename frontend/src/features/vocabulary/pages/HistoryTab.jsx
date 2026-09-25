import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { addDays, describeReviewDate, formatDayMonth, formatWeekday, todayInVietnam } from '@/lib/dates'
import { useLearningHistory, useLearningSummary } from '../api/learningQueries'
import { DueReviewCard } from '../components/DueReview'
import { VocabularyShell } from '../components/VocabularyShell'
import { WordList, WordListSkeleton } from '../components/WordList'
import { LEARNING_STATUS, reviewOption } from '../constants'
import { formatCount } from '../topicProgress'

function StatCard({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-white p-5">
      <span className="text-label font-medium text-muted">{label}</span>
      <span className="text-stat font-bold text-ink">{formatCount(value)}</span>
    </div>
  )
}

function Stats({ summary }) {
  if (summary.isPending) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-26.5 rounded-xl" />
        ))}
      </div>
    )
  }
  if (summary.isError) {
    return <LoadError error={summary.error} onRetry={() => summary.refetch()} message="Không tải được thống kê." />
  }

  const { dueToday, learningCount, masteredCount, reviewedToday } = summary.data
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {dueToday > 0 ? <DueReviewCard /> : <StatCard label="Cần ôn hôm nay" value={0} />}
      <StatCard label="Đang học" value={learningCount} />
      <StatCard label="Đã thuộc" value={masteredCount} />
      <StatCard label="Đã ôn hôm nay" value={reviewedToday} />
    </div>
  )
}

function Upcoming({ days }) {
  const tomorrow = addDays(todayInVietnam(), 1)

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink">Lịch ôn 7 ngày tới</h2>
      <ul>
        {days.map((day) => (
          <li key={day.date} className="flex items-center justify-between border-b border-canvas py-2.5 text-sm last:border-b-0">
            <span className="text-ink-soft">
              {day.date === tomorrow ? 'Ngày mai' : formatWeekday(day.date)}, {formatDayMonth(day.date)}
            </span>
            <span className={day.count > 0 ? 'font-semibold text-ink' : 'text-muted-light'}>
              {day.count > 0 ? `${formatCount(day.count)} từ` : 'Không có'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Right side of a history row: the last rating and when the word comes back. */
function ReviewState(word) {
  const option = reviewOption(word.lastReviewResult)
  return (
    <div className="flex flex-none flex-col items-end gap-1">
      {option && <Tag variant={option.tag}>{option.label}</Tag>}
      {word.nextReviewAt && (
        <span className="text-tag text-muted">
          {word.learningStatus === LEARNING_STATUS.MASTERED ? 'Đã thuộc · ' : ''}Ôn lại {describeReviewDate(word.nextReviewAt)}
        </span>
      )}
    </div>
  )
}

function RecentWords() {
  const history = useLearningHistory()

  let content
  if (history.isPending) {
    content = <WordListSkeleton rows={4} />
  } else if (history.isError) {
    content = (
      <LoadError error={history.error} onRetry={() => history.refetch()} message="Không tải được lịch sử học." />
    )
  } else {
    const words = history.data.pages.flatMap((page) => page.items)
    const total = history.data.pages[0].totalItems
    content =
      total === 0 ? (
        <Card>
          <p className="text-sm text-muted">Bạn chưa ôn từ nào. Hãy chọn một chủ đề ở tab “Chủ đề có sẵn” để bắt đầu học.</p>
        </Card>
      ) : (
        <>
          <WordList words={words} aside={ReviewState} />
          {history.hasNextPage && (
            <Button variant="outline" loading={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>
              {history.isFetchingNextPage ? 'Đang tải…' : `Xem thêm (còn ${formatCount(total - words.length)})`}
            </Button>
          )}
        </>
      )
  }

  return (
    <section aria-labelledby="recent-words" className="flex flex-col gap-3">
      <h2 id="recent-words" className="text-lg font-semibold text-ink">
        Từ đã ôn gần đây
      </h2>
      {content}
    </section>
  )
}

/** "Lịch sử học" tab (A2): what is due, the next 7 days, and the words reviewed most recently. */
export function HistoryTab() {
  const summary = useLearningSummary()

  return (
    <VocabularyShell tab="history" title="Lịch sử học">
      <Stats summary={summary} />
      {summary.data && <Upcoming days={summary.data.upcoming} />}
      <RecentWords />
    </VocabularyShell>
  )
}
