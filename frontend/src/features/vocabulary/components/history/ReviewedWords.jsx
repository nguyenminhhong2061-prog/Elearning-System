import { Link } from 'react-router'
import { loadedItems, totalItems } from '@/api/pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { Tag } from '@/components/ui/Tag'
import { paths } from '@/config/paths'
import { cx } from '@/lib/cx'
import { describeReviewDate } from '@/lib/dates'
import { formatCount } from '@/lib/format'
import { useLearningHistory } from '../../api/learningQueries'
import { ALL_REVIEWED, HISTORY_FILTERS, LEARNING_STATUS } from '../../constants'
import { reviewOption } from '../../utils/learning'
import { LoadMoreButton } from '../LoadMoreButton'
import { WordList, WordListSkeleton } from '../WordList'

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

/** The list itself: loading, error, nothing yet, or the words with "Xem thêm". */
function Words({ history, filter }) {
  if (history.isPending) return <WordListSkeleton rows={4} />
  if (history.isError) {
    return <LoadError error={history.error} onRetry={() => history.refetch()} message="Không tải được lịch sử học." />
  }

  const words = loadedItems(history.data)
  const total = totalItems(history.data)
  if (total === 0) return <EmptyState>{filter.empty}</EmptyState>

  return (
    <>
      <WordList words={words} aside={ReviewState} />
      <LoadMoreButton query={history} label={`Xem thêm (còn ${formatCount(total - words.length)})`} />
    </>
  )
}

/**
 * The words of the chosen statistic, or every reviewed word, latest review first.
 * @param {{ filterId: string | null, className?: string }} props filterId: a key of HISTORY_FILTERS
 */
export function ReviewedWords({ filterId, className }) {
  const filter = filterId ? HISTORY_FILTERS[filterId] : ALL_REVIEWED
  const history = useLearningHistory(filter.query)
  const total = history.data ? totalItems(history.data) : undefined
  const counted = filterId && total !== undefined

  return (
    <section aria-labelledby="reviewed-words" className={cx('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="reviewed-words" className="text-lg font-semibold text-ink">
          {filter.heading}
          {counted && ` (${formatCount(total)})`}
        </h2>
        {filterId && (
          <Link to={paths.vocabularyHistory()} className="text-label font-medium">
            Xem tất cả từ đã ôn
          </Link>
        )}
      </div>
      {/* Choosing a statistic changes this list without moving the focus, so screen readers are told here. */}
      <p role="status" className="sr-only">
        {counted ? `Đang hiển thị ${formatCount(total)} ${filter.heading.toLowerCase()}` : ''}
      </p>
      <Words history={history} filter={filter} />
    </section>
  )
}
