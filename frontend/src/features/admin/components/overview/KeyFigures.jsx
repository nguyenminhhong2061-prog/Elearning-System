import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'

/**
 * Scenario 26, step 4: the "Chỉ số chính" cards (SystemStat of the design).
 *
 * @param {{ stats: import('../../types').AdminStats }} props
 */
export function KeyFigures({ stats }) {
  const activeShare = stats.learners.total > 0 ? Math.round((stats.activeLearners / stats.learners.total) * 100) : 0
  const cards = [
    { label: 'Người học', value: stats.learners.total, note: `+${formatCount(stats.learners.newInPeriod)} người mới trong kỳ`, good: stats.learners.newInPeriod > 0 },
    { label: 'Hoạt động trong kỳ', value: stats.activeLearners, note: `${activeShare}% người học` },
    { label: 'Lượt ôn từ vựng', value: stats.reviews, note: 'thẻ flashcard đã đánh giá' },
    { label: 'Lượt làm bài tập', value: stats.exerciseAttempts, note: 'đọc hiểu, viết, nghe, phát âm' },
    { label: 'Bài kiểm tra đã nộp', value: stats.testsSubmitted, note: 'định kỳ và tổng hợp' },
  ]

  return (
    <section aria-label="Chỉ số chính" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(({ label, value, note, good }) => (
        <div key={label} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white px-5 py-4.5">
          <span className="text-label font-medium text-ink-soft">{label}</span>
          <span className="text-stat font-bold text-ink">{formatCount(value)}</span>
          <span className={cx('text-xs', good ? 'font-semibold text-success' : 'text-muted-strong')}>{note}</span>
        </div>
      ))}
    </section>
  )
}
