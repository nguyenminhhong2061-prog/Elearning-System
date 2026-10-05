import { formatDayMonth } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import { Panel } from '../Panel'

/** A round top for the y axis: 50 for 39, 10 for 7. */
function axisMax(value) {
  if (value <= 10) return 10
  const step = value <= 50 ? 25 : value <= 200 ? 50 : 100
  return Math.ceil(value / step) * step
}

/**
 * Scenario 26, step 4: learners active each day of the period, as bars (hand-drawn, no chart library).
 *
 * @param {{ days: { date: string, count: number }[], today: string }} props
 */
export function DailyActiveChart({ days, today }) {
  const counts = days.map((day) => day.count)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const max = axisMax(Math.max(...counts, 0))
  const average = days.length > 0 ? Math.round(total / days.length) : 0
  const lowest = days.reduce((low, day) => (day.count < low.count ? day : low), days[0])
  const highest = days.reduce((high, day) => (day.count > high.count ? day : high), days[0])
  // Five labels spread over the period, the last one being "Hôm nay" when the period ends today.
  const labelIndexes = [...new Set([0, 1, 2, 3, 4].map((step) => Math.round((step * (days.length - 1)) / 4)))]

  return (
    <Panel title="Người học hoạt động mỗi ngày" aside={total > 0 && `Trung bình ${formatCount(average)} người/ngày`}>
      {total === 0 ? (
        <p role="status" className="flex h-50 items-center justify-center rounded-[10px] bg-surface-alt text-sm text-ink-soft">
          Chưa có hoạt động trong kỳ này
        </p>
      ) : (
        <div
          role="img"
          aria-label={`Biểu đồ cột số người học hoạt động mỗi ngày từ ${formatDayMonth(days[0].date)} đến ${formatDayMonth(days.at(-1).date)}: thấp nhất ${lowest.count} người ngày ${formatDayMonth(lowest.date)}, cao nhất ${highest.count} người ngày ${formatDayMonth(highest.date)}.`}
          className="flex gap-2.5"
        >
          <div aria-hidden="true" className="flex h-50 w-7 flex-none flex-col justify-between text-right text-xs leading-3 text-muted-strong">
            <span>{max}</span>
            <span>{max / 2}</span>
            <span>0</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div
              className={cx(
                'flex h-50 items-end border-y border-dashed border-line [border-bottom-style:solid]',
                days.length > 45 ? 'gap-px' : 'gap-1.5',
                'bg-[linear-gradient(to_bottom,transparent_calc(50%-0.5px),var(--color-canvas)_calc(50%-0.5px),var(--color-canvas)_calc(50%+0.5px),transparent_calc(50%+0.5px))]',
              )}
            >
              {days.map((day) => (
                <div
                  key={day.date}
                  title={`${formatDayMonth(day.date)}: ${day.count} người`}
                  className={cx('min-w-0 flex-1 rounded-t-[3px]', day.date === today ? 'bg-brand-dark' : 'bg-brand')}
                  style={{ height: `${(day.count / max) * 100}%` }}
                />
              ))}
            </div>
            <div aria-hidden="true" className="flex justify-between text-xs text-muted-strong">
              {labelIndexes.map((index) => {
                const date = days[index].date
                return (
                  <span key={date} className={cx(date === today && 'font-semibold text-brand-dark')}>
                    {date === today ? 'Hôm nay' : formatDayMonth(date)}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
