import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCount } from '@/features/vocabulary/topicProgress'
import { cx } from '@/lib/cx'
import { todayInVietnam } from '@/lib/dates'
import { useActivity } from '../api/progressQueries'
import { bucketLabel, isEmptyActivity, rangeError, rangeName, rowName, summaryLine } from '../chart'
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

function DateInput({ label, value, onChange, max, invalid, describedBy }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? describedBy : undefined}
        className={cx(
          'min-h-9 rounded-lg border bg-white px-3 text-label text-ink outline-none focus:ring-2',
          invalid ? 'border-danger-solid focus:ring-danger-solid/20' : 'border-line focus:border-brand focus:ring-brand/25',
        )}
      />
    </div>
  )
}

/** Scenario 16, steps 4 and 5: "Từ ngày", "Đến ngày", "Xem"; the error stays under the form and nothing is asked. */
function RangeForm({ draft, onDraftChange, error, chosen, onSubmit, onClear }) {
  const errorId = useId()
  const today = todayInVietnam()
  return (
    <form
      noValidate
      aria-label="Chọn khoảng thời gian"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex flex-wrap items-end gap-2.5">
        <DateInput label="Từ ngày" value={draft.from} max={today} invalid={Boolean(error)} describedBy={errorId} onChange={(from) => onDraftChange({ ...draft, from })} />
        <DateInput label="Đến ngày" value={draft.to} max={today} invalid={Boolean(error)} describedBy={errorId} onChange={(to) => onDraftChange({ ...draft, to })} />
        <Button type="submit" variant="outline" size="sm" className="min-h-9 py-1.5">
          Xem
        </Button>
        {chosen && (
          <button type="button" onClick={onClear} className="min-h-9 cursor-pointer text-label font-semibold text-brand-dark hover:underline">
            Bỏ chọn ngày
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

const ROW_HEADERS = { DAY: 'Ngày', WEEK: 'Tuần', MONTH: 'Tháng' }

function Cells({ counts }) {
  const cell = 'px-3 py-2 text-right tabular-nums'
  return (
    <>
      <td className={cell}>{formatCount(counts.wordsLearned)}</td>
      <td className={cell}>{formatCount(counts.exercisesCompleted)}</td>
      <td className={cell}>{formatCount(counts.testsCompleted)}</td>
      <td className={cell}>
        {counts.averageTestScore === null ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">Không làm bài kiểm tra</span>
          </>
        ) : (
          counts.averageTestScore
        )}
      </td>
      <td className={cell}>{formatCount(counts.studyMinutes)} phút</td>
    </>
  )
}

/**
 * Scenario 16, step 6: every metric at once under the chart, with the totals. Screen readers always get it (the bars
 * are hidden from them); on screen it shows after "Xem" or on request, so the home page stays short.
 */
function DataTable({ activity, caption, visible }) {
  return (
    <div className={visible ? 'overflow-x-auto' : 'sr-only'}>
      <table className="w-full min-w-130 text-label text-ink">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              {ROW_HEADERS[activity.period]}
            </th>
            {['Số từ đã học', 'Bài tập hoàn thành', 'Bài kiểm tra', 'Điểm TB kiểm tra', 'Thời gian học'].map((name) => (
              <th key={name} scope="col" className="px-3 py-2 text-right font-semibold">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activity.items.map((item) => (
            <tr key={item.start} className="border-b border-line/70">
              <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">
                {rowName(item, activity.period)}
              </th>
              <Cells counts={item} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <th scope="row" className="px-3 py-2 text-left">
              Tổng
            </th>
            <Cells counts={activity.totals} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * The bars, drawn with plain elements (no chart library). The current period is the dark one; a period without a test
 * has no bar and a dash instead, because "no test" is not "0 points". Screen readers read the data table instead.
 */
function Bars({ activity, metric, ongoing }) {
  const values = activity.items.map((item) => item[metric.id])
  const max = Math.max(1, ...values.map((value) => value ?? 0))
  const last = values.length - 1

  return (
    <div aria-hidden="true" className={cx('flex h-55 items-stretch', values.length > 7 ? 'gap-1 sm:gap-2' : 'gap-2 sm:gap-3.5')}>
      {activity.items.map((item, index) => {
        const value = values[index]
        const current = ongoing && index === last
        return (
          <div key={item.start} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className={cx('font-semibold whitespace-nowrap', values.length > 12 ? 'text-tag' : 'text-xs', value === null ? 'text-muted-light' : 'text-ink-soft')}>
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
              {bucketLabel(item, activity.period, values.length)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * D1 "biểu đồ theo ngày/tuần/tháng": words learned, exercises completed, average test score and study time, over 7
 * days, 12 weeks or 6 months, or a range the learner chooses (scenario 16). The server groups the numbers; switching
 * the metric reuses the same answer.
 */
export function ActivityChart() {
  const [period, setPeriod] = useState('DAY')
  const [metricId, setMetricId] = useState(METRICS[0].id)
  const [draft, setDraft] = useState({ from: '', to: '' })
  const [range, setRange] = useState(null) // the range of the last valid "Xem", null for the default one
  const [rangeProblem, setRangeProblem] = useState(null)
  const [tableShown, setTableShown] = useState(false)
  const activity = useActivity(period, range)
  const metric = METRICS.find((candidate) => candidate.id === metricId)
  const data = activity.data
  const label = data ? rangeName(data, Boolean(range)) : ''

  function showRange() {
    const problem = rangeError(period, draft.from, draft.to, todayInVietnam())
    setRangeProblem(problem)
    if (problem) return
    setRange({ from: draft.from, to: draft.to })
    setTableShown(true)
  }

  // A range that suits weeks can be too long to show by day: go back to the default range and say why.
  function changePeriod(next) {
    setPeriod(next)
    if (!range) return
    const problem = rangeError(next, range.from, range.to, todayInVietnam())
    if (problem) {
      setRange(null)
      setRangeProblem(problem)
    }
  }

  function clearRange() {
    setDraft({ from: '', to: '' })
    setRange(null)
    setRangeProblem(null)
  }

  let body
  if (!data && activity.isError) {
    body = <LoadError error={activity.error} onRetry={() => activity.refetch()} message="Không tải được biểu đồ hoạt động." />
  } else if (!data) {
    body = <Skeleton className="h-55 w-full rounded-lg" />
  } else if (isEmptyActivity(data) && !range) {
    body = (
      <div className="flex h-55 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 text-center">
        <p className="text-body font-semibold text-ink">Chưa có hoạt động nào trong {label}</p>
        <p className="text-label text-ink-soft">Số từ mới, bài tập, điểm kiểm tra và thời gian học sẽ hiện ở đây khi bạn bắt đầu học.</p>
        <Link to={VOCABULARY_PATH} className="text-label font-semibold">
          Học từ vựng →
        </Link>
      </div>
    )
  } else {
    const ongoing = data.items.at(-1).end >= todayInVietnam()
    const caption = `Số liệu theo ${ROW_HEADERS[data.period].toLowerCase()}, ${label}`
    body = (
      <div aria-busy={activity.isPlaceholderData} className={cx('flex flex-col gap-4 transition-opacity', activity.isPlaceholderData && 'opacity-60')}>
        {isEmptyActivity(data) ? (
          // Scenario 16, branch 6a: a chosen range without activity still lists its periods, all at 0.
          <p className="flex h-30 items-center justify-center rounded-lg border border-dashed border-line px-4 text-center text-body font-semibold text-ink">
            Chưa có hoạt động nào {label}
          </p>
        ) : (
          <Bars activity={data} metric={metric} ongoing={ongoing} />
        )}
        <p className="text-label text-ink-soft">{summaryLine(data, label)}</p>
        {(metric.id === 'averageTestScore' || ongoing) && (
          <p className="text-xs text-muted">
            {metric.id === 'averageTestScore' ? 'Kỳ không làm bài kiểm tra để trống (—), không tính là 0 điểm.' : 'Cột đậm là kỳ hiện tại, chưa kết thúc.'}
          </p>
        )}
        <button
          type="button"
          aria-expanded={tableShown}
          onClick={() => setTableShown((shown) => !shown)}
          className="cursor-pointer self-start text-label font-semibold text-brand-dark hover:underline"
        >
          {tableShown ? 'Ẩn bảng số liệu' : 'Xem bảng số liệu'}
        </button>
        <DataTable activity={data} caption={caption} visible={tableShown} />
      </div>
    )
  }

  return (
    <section aria-labelledby="activity-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-title" className="text-lg font-semibold text-ink">
          Hoạt động học tập
        </h2>
        <PeriodSwitch value={period} onChange={changePeriod} />
      </div>
      <RangeForm draft={draft} onDraftChange={setDraft} error={rangeProblem} chosen={Boolean(range)} onSubmit={showRange} onClear={clearRange} />
      <MetricChips value={metricId} onChange={setMetricId} />
      {body}
    </section>
  )
}
