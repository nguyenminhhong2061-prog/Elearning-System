import { useState } from 'react'
import { Link } from 'react-router'
import { CEFR_LEVELS } from '@/api/constants'
import { Button } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { addDays, formatDayMonth, todayInVietnam } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { useStats } from '../api/adminQueries'
import { AdminPage } from '../components/AdminPage'
import { Segmented } from '../components/controls'
import { formatClock, formatDateRange, formatNumber, isoWeek, parseTypedDate, SKILL_LABELS } from '../format'
import { useUrlFilters } from '../useUrlFilters'

const PERIODS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: 'custom', label: 'Tùy chọn…' },
]
const CARD = 'flex flex-col gap-3.5 rounded-xl border border-line bg-white px-5.5 py-5'

/** The period asked for: the last 7/30/90 days up to today, or the admin's own dates. */
function periodOf(filters, today) {
  if (filters.period === 'custom' && filters.from && filters.to) return { from: filters.from, to: filters.to }
  const days = Number(filters.period === 'custom' ? 30 : filters.period) || 30
  return { from: addDays(today, -(days - 1)), to: today }
}

/** Scenario 25: the admin area's home page. */
export function AdminOverviewPage() {
  const today = todayInVietnam()
  const [filters, setFilters] = useUrlFilters({ period: '30', from: '', to: '' })
  const period = periodOf(filters, today)
  const stats = useStats(period)
  const [choosing, setChoosing] = useState(false)

  const periodLabel =
    filters.period === 'custom' && filters.from ? 'Khoảng tự chọn' : `${filters.period === 'custom' ? 30 : filters.period} ngày gần nhất`

  return (
    <AdminPage
      title="Tổng quan hệ thống"
      summary={
        <>
          {periodLabel}: {formatDateRange(period.from, period.to)}
          {stats.data && ` · cập nhật lúc ${formatClock(stats.data.generatedAt)}`}
        </>
      }
      actions={
        <Segmented
          label="Khoảng thời gian"
          options={PERIODS}
          value={choosing ? 'custom' : filters.period}
          onChange={(value) => {
            if (value === 'custom') setChoosing(true)
            else {
              setChoosing(false)
              setFilters({ period: value, from: '', to: '' })
            }
          }}
        />
      }
    >
      {choosing && (
        <CustomPeriod
          initial={period}
          today={today}
          onApply={({ from, to }) => {
            setChoosing(false)
            setFilters({ period: 'custom', from, to })
          }}
          onCancel={() => setChoosing(false)}
        />
      )}

      {stats.isPending ? (
        <OverviewSkeleton />
      ) : stats.isError ? (
        <LoadError error={stats.error} onRetry={stats.refetch} message="Không tải được số liệu thống kê. Vui lòng thử lại." />
      ) : (
        <Overview stats={stats.data} today={today} />
      )}
    </AdminPage>
  )
}

function CustomPeriod({ initial, today, onApply, onCancel }) {
  const [from, setFrom] = useState(formatDayMonth(initial.from) + `/${initial.from.slice(0, 4)}`)
  const [to, setTo] = useState(formatDayMonth(initial.to) + `/${initial.to.slice(0, 4)}`)
  const [error, setError] = useState(null)

  function apply(event) {
    event.preventDefault()
    const start = parseTypedDate(from)
    const end = parseTypedDate(to)
    if (!start || !end) return setError('Nhập ngày theo dạng ngày/tháng/năm, ví dụ 01/09/2026.')
    if (start > end) return setError('Ngày bắt đầu phải trước hoặc trùng ngày kết thúc.')
    if (addDays(start, 365) < end) return setError('Chọn khoảng tối đa một năm.')
    if (start > today) return setError('Ngày bắt đầu không được sau hôm nay.')
    onApply({ from: start, to: end })
  }

  return (
    <form onSubmit={apply} noValidate aria-label="Chọn khoảng thời gian" className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white px-5 py-4">
      {[
        ['Từ ngày', from, setFrom],
        ['Đến ngày', to, setTo],
      ].map(([label, value, setValue]) => (
        <label key={label} className="flex flex-col gap-1.5 text-label font-medium text-ink-soft">
          {label}
          <input
            value={value}
            onChange={(event) => {
              setError(null)
              setValue(event.target.value)
            }}
            placeholder="dd/mm/yyyy"
            inputMode="numeric"
            aria-invalid={error ? true : undefined}
            className={cx(
              'w-36 rounded-lg border bg-white px-3 py-2.25 text-sm text-ink outline-none focus:ring-2',
              error ? 'border-danger-solid focus:ring-danger-solid/20' : 'border-line focus:border-brand focus:ring-brand/25',
            )}
          />
        </label>
      ))}
      <Button type="submit" variant="strong" size="xs">
        Xem số liệu
      </Button>
      <Button variant="outline" size="xs" onClick={onCancel}>
        Hủy
      </Button>
      {error && (
        <p role="alert" className="w-full text-label font-semibold text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

function Overview({ stats, today }) {
  const learnersShare = stats.learners.total > 0 ? Math.round((stats.activeToday / stats.learners.total) * 100) : 0
  const cards = [
    ['Người học', formatNumber(stats.learners.total), `+${formatNumber(stats.learners.newInPeriod)} người mới trong kỳ`, true],
    ['Hoạt động hôm nay', formatNumber(stats.activeToday), `${learnersShare}% người học`],
    ['Lượt ôn từ vựng', formatNumber(stats.reviews), 'thẻ flashcard đã đánh giá'],
    ['Bài tập hoàn thành', formatNumber(stats.exercisesCompleted), 'ngữ pháp, nghe, phát âm'],
    ['Bài kiểm tra đã nộp', formatNumber(stats.testsSubmitted), 'định kỳ và tổng hợp'],
  ]

  return (
    <>
      <section aria-label="Chỉ số chính" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, value, note, positive]) => (
          <div key={label} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white px-5 py-4.5">
            <span className="text-label font-medium text-ink-soft">{label}</span>
            <span className="text-stat font-bold text-ink">{value}</span>
            <span className={cx('text-xs', positive && stats.learners.newInPeriod > 0 ? 'font-semibold text-success' : 'text-muted-strong')}>{note}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DailyActiveChart days={stats.dailyActive} today={today} />
        <LevelBreakdown levels={stats.levels} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopTopics topics={stats.topTopics} />
        <TopLessons lessons={stats.topLessons} />
        <Attention attention={stats.attention} />
      </div>
    </>
  )
}

/** A round top for the y axis: 50 for 39, 10 for 7. */
function axisMax(value) {
  if (value <= 10) return 10
  const step = value <= 50 ? 25 : value <= 200 ? 50 : 100
  return Math.ceil(value / step) * step
}

function DailyActiveChart({ days, today }) {
  const counts = days.map((day) => day.count)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const max = axisMax(Math.max(...counts, 0))
  const average = days.length > 0 ? Math.round(total / days.length) : 0
  const lowest = days.reduce((low, day) => (day.count < low.count ? day : low), days[0])
  const highest = days.reduce((high, day) => (day.count > high.count ? day : high), days[0])
  // Five labels spread over the period, the last one being "Hôm nay" when the period ends today.
  const labelIndexes = [...new Set([0, 1, 2, 3, 4].map((step) => Math.round((step * (days.length - 1)) / 4)))]

  return (
    <section aria-labelledby="daily-title" className={cx(CARD, 'gap-4')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="daily-title" className="text-base font-bold text-ink">
          Người học hoạt động mỗi ngày
        </h2>
        {total > 0 && <span className="text-label text-muted-strong">Trung bình {formatNumber(average)} người/ngày</span>}
      </div>
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
    </section>
  )
}

function LevelBreakdown({ levels }) {
  const rows = [...CEFR_LEVELS.map((level) => [level, level, levels[level] ?? 0]), ['NONE', 'Chưa xác định', levels.NONE ?? 0]]
  const total = rows.reduce((sum, [, , count]) => sum + count, 0)
  const max = Math.max(...rows.map(([, , count]) => count), 1)
  return (
    <section aria-labelledby="levels-title" className={CARD}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="levels-title" className="text-base font-bold text-ink">
          Trình độ người học
        </h2>
        <span className="text-label text-muted-strong">{formatNumber(total)} người</span>
      </div>
      <ul className="flex flex-col gap-2.75">
        {rows.map(([key, label, count]) => (
          <li key={key} className="flex items-center gap-2.5 text-label">
            <span className={cx('w-24 flex-none font-semibold', key === 'NONE' ? 'text-ink-soft' : 'text-ink')}>{label}</span>
            <span aria-hidden="true" className="flex h-2.5 flex-1 rounded-full bg-canvas">
              <span className={cx('rounded-full', key === 'NONE' ? 'bg-muted-light' : 'bg-brand')} style={{ width: `${(count / max) * 100}%` }} />
            </span>
            <span className="w-8 flex-none text-right text-ink-soft">{count}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-strong">Trình độ đổi sau mỗi bài kiểm tra tổng hợp.</p>
    </section>
  )
}

function TopTopics({ topics }) {
  const max = Math.max(...topics.map((topic) => topic.reviews), 1)
  return (
    <section aria-labelledby="topics-title" className={CARD}>
      <h2 id="topics-title" className="text-base font-bold text-ink">
        Chủ đề được ôn nhiều nhất
      </h2>
      {topics.length === 0 ? (
        <p className="text-sm text-ink-soft">Chưa có lượt ôn nào trong kỳ này.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {topics.map((topic, index) => (
            <li key={topic.topicId} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-label">
                <Link to={`/admin/vocabulary/topics/${topic.topicId}`} className="font-semibold text-ink">
                  {index + 1}. {topic.name}
                </Link>
                <span className="text-ink-soft">{formatNumber(topic.reviews)} lượt</span>
              </div>
              <span aria-hidden="true" className="flex h-1.5 rounded-full bg-canvas">
                <span className="rounded-full bg-brand" style={{ width: `${(topic.reviews / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function TopLessons({ lessons }) {
  return (
    <section aria-labelledby="lessons-title" className={CARD}>
      <h2 id="lessons-title" className="text-base font-bold text-ink">
        Bài tập được làm nhiều nhất
      </h2>
      {lessons.length === 0 ? (
        <p className="text-sm text-ink-soft">Chưa có bài tập nào được làm trong kỳ này.</p>
      ) : (
        <ol className="flex flex-col">
          {lessons.map((lesson) => (
            <li key={lesson.lessonId} className="flex items-center justify-between gap-3 border-b border-canvas py-3 last:border-b-0">
              <div className="flex min-w-0 flex-col gap-0.75">
                <Link to={`/admin/lessons/${lesson.lessonId}`} className="text-sm font-semibold text-ink">
                  {lesson.title}
                </Link>
                <span className="text-xs text-muted-strong">
                  {SKILL_LABELS[lesson.skill]} · {lesson.cefrLevel} · {formatNumber(lesson.attempts)} lượt
                </span>
              </div>
              <span className={cx('flex-none text-label font-bold', lesson.averageScore >= 80 ? 'text-success' : 'text-ink-soft')}>TB {lesson.averageScore}%</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

const TONES = {
  warning: 'bg-warning-bg text-warning hover:text-warning',
  danger: 'bg-danger-bg text-danger hover:text-danger',
  neutral: 'bg-canvas text-ink-soft hover:text-ink',
}

function Attention({ attention }) {
  const items = [
    attention.wordsMissingAudio > 0 && ['warning', `${formatNumber(attention.wordsMissingAudio)} từ chưa có audio phát âm`, '/admin/vocabulary?missing=AUDIO'],
    attention.wordsMissingExample > 0 && ['warning', `${formatNumber(attention.wordsMissingExample)} từ chưa có câu ví dụ`, '/admin/vocabulary?missing=EXAMPLE'],
    ...attention.lessonsWithIssues.map((lesson) => [
      'danger',
      lesson.issue === 'MISSING_AUDIO' ? `Bài nghe “${lesson.title}” thiếu file audio` : `Bài “${lesson.title}” chưa có câu hỏi`,
      `/admin/lessons/${lesson.lessonId}`,
    ]),
    attention.periodicTestGap && [
      'danger',
      `Chưa có đề định kỳ tuần ${isoWeek(attention.periodicTestGap.weekEnd)} (đề hiện tại đóng ${formatDayMonth(addDays(attention.periodicTestGap.weekStart, -1))})`,
      '/admin/tests',
    ],
    attention.lockedUsers > 0 && ['neutral', `${attention.lockedUsers} tài khoản đang bị khóa`, '/admin/users?status=LOCKED'],
  ].filter(Boolean)

  return (
    <section aria-labelledby="attention-title" className={CARD}>
      <h2 id="attention-title" className="text-base font-bold text-ink">
        Cần chú ý
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">Không có việc cần xử lý.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(([tone, text, to]) => (
            <li key={text}>
              <Link to={to} className={cx('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-label leading-4.25 font-semibold', TONES[tone])}>
                <span className="flex-1">{text}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function OverviewSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-fade-in-late flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
