import { cx } from '@/lib/cx'
import { addDays, formatDayMonth, formatWeekday, todayInVietnam } from '@/lib/dates'
import { formatCount } from '@/lib/format'

/**
 * "Lịch ôn 7 ngày tới": how many words come back each day. Built like the word list beside it (heading above a white
 * box, same paddings), so on wide screens both headings and both boxes line up.
 *
 * @param {{ days: Array<{ date: string, count: number }>, className?: string }} props
 */
export function UpcomingReviews({ days, className }) {
  const tomorrow = addDays(todayInVietnam(), 1)

  return (
    <section aria-labelledby="upcoming-reviews" className={cx('flex flex-col gap-3', className)}>
      <h2 id="upcoming-reviews" className="text-lg font-semibold text-ink">
        Lịch ôn 7 ngày tới
      </h2>
      <ul className="rounded-xl border border-line bg-white px-5 py-1.5">
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
    </section>
  )
}
