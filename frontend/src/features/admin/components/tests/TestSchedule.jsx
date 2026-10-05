import { addDays, formatDayMonth } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { isoWeek } from '../../utils/format'
import { displayStatus } from '../../utils/testDraft'

const LABELS = { OPEN: ['Đang mở', 'text-success'], UPCOMING: ['Sắp mở', 'text-brand-dark'], CLOSED: ['Đã đóng', 'text-muted-strong'] }

/**
 * "Lịch đề định kỳ": the last three scheduled weekly tests and the two weeks after them, with the draft or the gap
 * there.
 *
 * @param {{ tests: import('../../types').AdminTestSummary[] }} props the weekly tests
 */
export function TestSchedule({ tests }) {
  const scheduled = tests.filter((test) => test.status === 'VISIBLE').toSorted((a, b) => a.endDate.localeCompare(b.endDate))
  if (scheduled.length === 0) return null
  const rows = scheduled.slice(-3).map((test) => ({ key: test.id, week: isoWeek(test.endDate), start: test.startDate, end: test.endDate, test }))
  let lastEnd = scheduled.at(-1).endDate
  for (let step = 0; step < 2; step += 1) {
    const start = addDays(lastEnd, 1)
    const end = addDays(lastEnd, 7)
    const draft = tests.find((test) => test.status === 'DRAFT' && test.startDate >= start && test.startDate <= end)
    rows.push({ key: `gap-${start}`, week: isoWeek(end), start, end, draft })
    lastEnd = end
  }

  const label = (row) => {
    if (row.test) return LABELS[displayStatus(row.test)]
    return row.draft ? ['Bản nháp', 'text-warning'] : ['Chưa có đề', 'text-danger']
  }

  return (
    <section aria-labelledby="schedule-title" className="flex flex-col gap-3.5 rounded-xl border border-line bg-white px-5.5 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="schedule-title" className="text-base font-bold text-ink">
          Lịch đề định kỳ
        </h2>
        <span className="text-label text-muted-strong">Mỗi tuần một đề, mở 7 ngày</span>
      </div>
      <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {rows.map((row) => {
          const [text, tone] = label(row)
          const missing = !row.test && !row.draft
          return (
            <li key={row.key} className={cx('flex flex-col gap-1 rounded-[10px] border px-3.5 py-3', missing ? 'border-dashed border-danger-solid/50 bg-danger-bg/40' : 'border-line bg-surface-alt')}>
              <span className="text-label font-bold text-ink">Tuần {row.week}</span>
              <span className="text-xs text-muted-strong">
                {formatDayMonth(row.start)} – {formatDayMonth(row.end)}
              </span>
              <span className={cx('text-xs font-semibold', tone)}>{text}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
