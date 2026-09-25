import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { addDays, describeReviewDate, formatDayMonth, formatWeekday, todayInVietnam } from '@/lib/dates'
import { useLearningHistory, useLearningSummary } from '../api/learningQueries'
import { DueReviewCard } from '../components/DueReview'
import { VocabularyShell } from '../components/VocabularyShell'
import { WordList, WordListSkeleton } from '../components/WordList'
import { LEARNING_STATUS, reviewOption } from '../constants'
import { formatCount } from '../topicProgress'

const HISTORY_PATH = '/vocabulary?tab=history'

/**
 * Statistics that show their words when chosen (?show= in the URL, so reloads and the back button keep the choice),
 * with the history filter each one sends (docs/api/learning.md).
 */
const WORD_FILTERS = {
  learning: {
    label: 'Đang học',
    query: { status: LEARNING_STATUS.LEARNING },
    heading: 'Từ đang học',
    empty: 'Chưa có từ nào đang học. Hãy chọn một chủ đề ở tab “Chủ đề có sẵn” để bắt đầu học.',
  },
  mastered: {
    label: 'Đã thuộc',
    query: { status: LEARNING_STATUS.MASTERED },
    heading: 'Từ đã thuộc',
    empty: 'Chưa có từ nào đã thuộc. Một từ được tính là đã thuộc sau 4 lần bạn chọn “Nhớ rõ” (chọn “Chưa nhớ” thì tính lại từ đầu).',
  },
  today: {
    label: 'Đã ôn hôm nay',
    query: { reviewedToday: true },
    heading: 'Từ đã ôn hôm nay',
    empty: 'Hôm nay bạn chưa ôn từ nào.',
  },
}

/** The list shown when no statistic is chosen. */
const ALL_REVIEWED = {
  query: {},
  heading: 'Từ đã ôn gần đây',
  empty: 'Bạn chưa ôn từ nào. Hãy chọn một chủ đề ở tab “Chủ đề có sẵn” để bắt đầu học.',
}

const filterPath = (id) => (id ? `${HISTORY_PATH}&show=${id}` : HISTORY_PATH)

/** Id of the statistic named by ?show=, or null when there is none or it is unknown. */
function useChosenFilter() {
  const [searchParams] = useSearchParams()
  const show = searchParams.get('show')
  return show !== null && Object.hasOwn(WORD_FILTERS, show) ? show : null
}

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
  const { label } = WORD_FILTERS[id]

  return (
    <Link
      to={filterPath(chosen ? null : id)}
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

function Stats({ summary, chosen }) {
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
      {Object.keys(WORD_FILTERS).map((id) => (
        <FilterCard key={id} id={id} value={counts[id]} chosen={id === chosen} />
      ))}
    </div>
  )
}

function Upcoming({ days, className }) {
  const tomorrow = addDays(todayInVietnam(), 1)

  return (
    <Card className={cx('flex flex-col gap-2', className)}>
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

/** The words of the chosen statistic, or every reviewed word, latest review first. */
function ReviewedWords({ filterId, className }) {
  const filter = filterId ? WORD_FILTERS[filterId] : ALL_REVIEWED
  const history = useLearningHistory(filter.query)
  const total = history.data?.pages[0].totalItems

  let content
  if (history.isPending) {
    content = <WordListSkeleton rows={4} />
  } else if (history.isError) {
    content = (
      <LoadError error={history.error} onRetry={() => history.refetch()} message="Không tải được lịch sử học." />
    )
  } else {
    const words = history.data.pages.flatMap((page) => page.items)
    content =
      total === 0 ? (
        <Card>
          <p className="text-sm text-muted">{filter.empty}</p>
        </Card>
      ) : (
        <>
          <WordList words={words} aside={ReviewState} />
          {history.hasNextPage && (
            <Button variant="outline" className="sm:min-w-60 sm:self-center" loading={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>
              {history.isFetchingNextPage ? 'Đang tải…' : `Xem thêm (còn ${formatCount(total - words.length)})`}
            </Button>
          )}
        </>
      )
  }

  const counted = filterId && total !== undefined
  return (
    <section aria-labelledby="reviewed-words" className={cx('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="reviewed-words" className="text-lg font-semibold text-ink">
          {filter.heading}
          {counted && ` (${formatCount(total)})`}
        </h2>
        {filterId && (
          <Link to={HISTORY_PATH} className="text-label font-medium">
            Xem tất cả từ đã ôn
          </Link>
        )}
      </div>
      {/* Choosing a statistic changes this list without moving the focus, so screen readers are told here. */}
      <p role="status" className="sr-only">
        {counted ? `Đang hiển thị ${formatCount(total)} ${filter.heading.toLowerCase()}` : ''}
      </p>
      {content}
    </section>
  )
}

/**
 * "Lịch sử học" tab (A2): what is due, the words behind each count (chosen by clicking it), and the next 7 days.
 * The word list sits right under the counts so that choosing one shows its words without scrolling.
 */
export function HistoryTab() {
  const summary = useLearningSummary()
  const chosen = useChosenFilter()

  return (
    <VocabularyShell tab="history" title="Lịch sử học">
      <Stats summary={summary} chosen={chosen} />
      <div className="flex flex-wrap items-start gap-5">
        <ReviewedWords filterId={chosen} className="min-w-0 flex-[2_1_432px]" />
        {summary.data && <Upcoming days={summary.data.upcoming} className="flex-[1_1_260px]" />}
      </div>
    </VocabularyShell>
  )
}
