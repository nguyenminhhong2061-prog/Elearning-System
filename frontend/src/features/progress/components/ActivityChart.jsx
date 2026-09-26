import { useState } from 'react'
import { Link } from 'react-router'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx } from '@/lib/cx'
import { useActivity } from '../api/progressQueries'
import { bucketLabel, bucketName, isEmptyActivity, rangeOf, summaryLine } from '../chart'
import { METRICS, PERIODS, VOCABULARY_PATH } from '../constants'

const BAR_AREA_PX = 150

const toggleClass = 'min-h-9 cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

function PeriodSwitch({ value, onChange }) {
  return (
    <div role="group" aria-label="Khoảng thời gian" className="flex gap-0.5 rounded-[9px] bg-canvas p-0.75">
      {PERIODS.map((period) => {
        const on = period.id === value
        return (
          <button
            key={period.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(period.id)}
            className={cx(toggleClass, 'rounded-[7px] px-4 text-label', on ? 'bg-white text-ink shadow-[0_1px_2px_rgba(22,33,31,0.12)]' : 'text-ink-soft hover:text-ink')}
          >
            {period.label}
          </button>
        )
      })}
    </div>
  )
}

function MetricChips({ value, onChange }) {
  return (
    <div role="group" aria-label="Chỉ số" className="flex flex-wrap gap-2">
      {METRICS.map((metric) => {
        const on = metric.id === value
        return (
          <button
            key={metric.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(metric.id)}
            className={cx(
              toggleClass,
              'rounded-full border px-3.5 text-label',
              on ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line bg-white text-ink-soft hover:border-brand',
            )}
          >
            {metric.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The bars, drawn with plain elements (no chart library). The current period is the dark one; a period without a test
 * has no bar and a dash instead, because "no test" is not "0 points". Screen readers get the same numbers as a table.
 */
function Bars({ activity, metric }) {
  const values = activity.items.map((item) => item[metric.id])
  const max = Math.max(1, ...values.map((value) => value ?? 0))
  const last = values.length - 1

  return (
    <>
      <div aria-hidden="true" className={cx('flex h-55 items-stretch', values.length > 7 ? 'gap-1 sm:gap-2' : 'gap-2 sm:gap-3.5')}>
        {activity.items.map((item, index) => {
          const value = values[index]
          const current = index === last
          return (
            <div key={item.start} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <span className={cx('text-xs font-semibold whitespace-nowrap', value === null ? 'text-muted-light' : 'text-ink-soft')}>
                {value === null ? '—' : value}
              </span>
              {value === null ? (
                <span className="w-full border-t-2 border-dashed border-line" />
              ) : (
                <span
                  className={cx('w-full rounded-t-[5px]', value === 0 ? 'bg-canvas' : current ? 'bg-brand' : 'bg-brand-soft')}
                  style={{ height: `${Math.max(4, Math.round((value / max) * BAR_AREA_PX))}px` }}
                />
              )}
              <span className={cx('text-tag whitespace-nowrap', current ? 'font-bold text-brand-dark' : 'font-medium text-muted')}>
                {bucketLabel(item, activity.period)}
              </span>
            </div>
          )
        })}
      </div>
      <table className="sr-only">
        <caption>{`${metric.label}, ${rangeOf(activity.period)}`}</caption>
        <thead>
          <tr>
            <th scope="col">Thời gian</th>
            <th scope="col">{metric.label}</th>
          </tr>
        </thead>
        <tbody>
          {activity.items.map((item, index) => (
            <tr key={item.start}>
              <th scope="row">{bucketName(item, activity.period)}</th>
              <td>{values[index] === null ? 'Không làm bài kiểm tra' : `${values[index]} ${metric.unit}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/**
 * D1 "biểu đồ theo ngày/tuần/tháng": words learned, exercises completed, average test score and study time, over 7
 * days, 12 weeks or 6 months. The server groups the numbers; switching the metric reuses the same answer.
 */
export function ActivityChart() {
  const [period, setPeriod] = useState('DAY')
  const [metricId, setMetricId] = useState(METRICS[0].id)
  const activity = useActivity(period)
  const metric = METRICS.find((candidate) => candidate.id === metricId)
  const data = activity.data

  let body
  if (!data && activity.isError) {
    body = <LoadError error={activity.error} onRetry={() => activity.refetch()} message="Không tải được biểu đồ hoạt động." />
  } else if (!data) {
    body = <Skeleton className="h-55 w-full rounded-lg" />
  } else if (isEmptyActivity(data)) {
    body = (
      <div className="flex h-55 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 text-center">
        <p className="text-body font-semibold text-ink">Chưa có hoạt động nào trong {rangeOf(data.period)}</p>
        <p className="text-label text-ink-soft">Số từ mới, bài tập, điểm kiểm tra và thời gian học sẽ hiện ở đây khi bạn bắt đầu học.</p>
        <Link to={VOCABULARY_PATH} className="text-label font-semibold">
          Học từ vựng →
        </Link>
      </div>
    )
  } else {
    body = (
      <div aria-busy={activity.isPlaceholderData} className={cx('flex flex-col gap-4 transition-opacity', activity.isPlaceholderData && 'opacity-60')}>
        <Bars activity={data} metric={metric} />
        <p className="text-label text-ink-soft">{summaryLine(data)}</p>
        <p className="text-xs text-muted">
          {metric.id === 'averageTestScore' ? 'Kỳ không làm bài kiểm tra để trống (—), không tính là 0 điểm.' : 'Cột đậm là kỳ hiện tại, chưa kết thúc.'}
        </p>
      </div>
    )
  }

  return (
    <section aria-labelledby="activity-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-title" className="text-lg font-semibold text-ink">
          Hoạt động học tập
        </h2>
        <PeriodSwitch value={period} onChange={setPeriod} />
      </div>
      <MetricChips value={metricId} onChange={setMetricId} />
      {body}
    </section>
  )
}
