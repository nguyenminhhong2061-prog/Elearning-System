import { cx } from '@/lib/cx'
import { formatRange } from '../plan'

/** A week's result: reached or missed once it is over, "đang học" now, nothing before it starts. */
function WeekMark({ week, current }) {
  if (week.status === 'DONE' && week.achieved === true) return <span className="text-xs font-semibold text-success">✓ Đạt</span>
  if (week.status === 'DONE' && week.achieved === false) return <span className="text-xs font-semibold text-warning">Chưa đạt</span>
  if (current) return <span className="text-xs font-semibold text-brand-dark">Đang học</span>
  return null
}

/**
 * The weekly schedule (study_plan_schedule), in order. In a preview the weeks have no progress or status yet.
 *
 * @param {object} props
 * @param {import('../types').PlanWeek[]} props.weeks
 * @param {number | null} [props.currentWeek]
 */
export function WeekList({ weeks, currentWeek = null }) {
  return (
    <ol className="flex flex-col divide-y divide-line">
      {weeks.map((week) => {
        const current = week.weekNumber === currentWeek
        return (
          <li
            key={week.weekNumber}
            aria-current={current ? 'step' : undefined}
            className={cx('flex flex-col gap-1 py-2.5', current && '-mx-2 rounded-lg bg-brand-tint px-2')}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-label font-semibold text-ink">
                Tuần {week.weekNumber}
                <span className="ml-2 text-xs font-normal text-muted">{formatRange(week.startDate, week.endDate)}</span>
              </span>
              <WeekMark week={week} current={current} />
            </div>
            <p className="text-label text-ink-soft">{week.description}</p>
            <p className="text-xs text-muted">
              Mục tiêu: {week.targetWords} từ · {week.targetExercises} bài tập
              {week.status === 'DONE' && ` · Đã làm: ${week.wordsDone} từ, ${week.exercisesDone} bài`}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
