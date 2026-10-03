import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { todayInVietnam } from '@/lib/dates'
import { REMINDER_LINE, currentWeekOf, formatDate, formatRange, lastMissedWeek, levelPath, minutesLabel, periodLine, planPhase, share } from '../plan'
import { WeekList } from './WeekList'

const STATUS = {
  ACTIVE: { label: 'Đang thực hiện', variant: 'brand' },
  PAUSED: { label: 'Tạm dừng', variant: 'warning' },
  COMPLETED: { label: 'Đã kết thúc', variant: 'neutral' },
}

function ProgressRow({ label, done, target, unit }) {
  const reached = done >= target
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-label">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className={cx('font-semibold', reached ? 'text-success' : 'text-ink')}>
          {done}/{target} {unit}
          {reached && ' ✓'}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(done, target)}
        className="h-2 overflow-hidden rounded-full bg-canvas"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${share(done, target) * 100}%` }} />
      </div>
    </div>
  )
}

/** Scenario 17 step 9: before its first day a plan says so, with what week 1 asks. */
function NotStarted({ plan }) {
  const first = plan.weeks[0]
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] bg-surface-alt p-4">
      <h3 className="text-body font-semibold text-ink">Tuần hiện tại: chưa bắt đầu</h3>
      <p className="text-label text-ink-soft">Kế hoạch bắt đầu ngày {formatDate(plan.startDate)}.</p>
      {first && (
        <p className="text-label text-ink-soft">
          Tuần 1 ({formatRange(first.startDate, first.endDate)}): {first.description ? `${first.description} · ` : ''}mục tiêu{' '}
          {first.targetWords} từ, {first.targetExercises} bài tập.
        </p>
      )}
    </div>
  )
}

/**
 * "Kế hoạch của bạn" (scenarios 17 step 9 and 18 step 3): the goal, the levels, the dates, this week's targets and
 * progress, the D2 warning when the last week fell short (no penalty, just a suggestion to adjust), the whole
 * schedule, the weekly reminder, and pausing or adjusting the plan.
 *
 * @param {object} props
 * @param {import('../types').StudyPlan} props.plan
 * @param {string | null} props.currentLevel
 * @param {() => void} props.onAdjust opens "Điều chỉnh kế hoạch"
 * @param {() => void} props.onNewPlan opens the goal form, once the plan's last day has passed
 * @param {(status: 'ACTIVE' | 'PAUSED') => void} props.onStatus
 * @param {boolean} props.changingStatus
 */
export function PlanOverview({ plan, currentLevel, onAdjust, onNewPlan, onStatus, changingStatus }) {
  const status = STATUS[plan.status] ?? STATUS.ACTIVE
  const week = currentWeekOf(plan)
  const phase = planPhase(plan, todayInVietnam())
  const missed = plan.status === 'ACTIVE' ? lastMissedWeek(plan) : null
  const paused = plan.status === 'PAUSED'
  const period = [periodLine(plan.startDate, plan.endDate, plan.weeks.length)]
  if (plan.dailyMinutes) period.push(minutesLabel(plan.dailyMinutes))

  return (
    <section aria-labelledby="plan-title" className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="plan-title" className="text-lg font-semibold text-ink">
            Kế hoạch của bạn
          </h2>
          <p className="text-label text-ink-soft">Mục tiêu của bạn: “{plan.goal.description}”</p>
          <p className="text-xl font-bold text-brand-dark">Trình độ {levelPath(plan.startLevel, plan.goal.targetLevel)}</p>
          <p className="text-label text-muted">{period.join(' · ')}</p>
        </div>
        <Tag variant={status.variant}>{status.label}</Tag>
      </div>

      {paused && (
        <Alert variant="info">Kế hoạch đang tạm dừng. Tiếp tục bất cứ lúc nào, các tuần vẫn giữ nguyên ngày.</Alert>
      )}

      {missed && (
        <Alert variant="warning" className="flex flex-col items-start gap-2 font-normal">
          <span>
            <strong>
              Tuần {missed.weekNumber} chưa đạt mục tiêu ({missed.wordsDone}/{missed.targetWords} từ, {missed.exercisesDone}/
              {missed.targetExercises} bài)
            </strong>
            . Không sao, kết quả đã học vẫn được giữ. Nếu mục tiêu đang quá sức, bạn có thể giảm mục tiêu các tuần tới.
          </span>
          <button type="button" onClick={onAdjust} className="cursor-pointer font-semibold underline">
            Điều chỉnh ngay
          </button>
        </Alert>
      )}

      {phase === 'NOT_STARTED' ? (
        <NotStarted plan={plan} />
      ) : week ? (
        <div className="flex flex-col gap-3 rounded-[10px] bg-surface-alt p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-body font-semibold text-ink">
              Tuần này · tuần {week.weekNumber}/{plan.weeks.length}
            </h3>
            <span className="text-xs text-muted">{formatRange(week.startDate, week.endDate)}</span>
          </div>
          <p className="text-label text-ink-soft">{week.description}</p>
          <ProgressRow label="Từ mới" done={week.wordsDone} target={week.targetWords} unit="từ" />
          <ProgressRow label="Bài tập" done={week.exercisesDone} target={week.targetExercises} unit="bài" />
        </div>
      ) : (
        <Alert variant="info" className="flex flex-col items-start gap-2 font-normal">
          <span>Kế hoạch đã kết thúc ngày {formatDate(plan.endDate)}. Làm bài kiểm tra tổng hợp để xem mình đã tiến bộ thế nào, rồi đặt mục tiêu mới.</span>
          <button type="button" onClick={onNewPlan} className="cursor-pointer font-semibold underline">
            Lập kế hoạch mới
          </button>
        </Alert>
      )}

      {plan.summary && (
        <div className="flex flex-col gap-1">
          <h3 className="text-label font-semibold text-ink">Lời khuyên của trợ lý AI</h3>
          <p className="text-label whitespace-pre-line text-ink-soft">{plan.summary}</p>
        </div>
      )}

      <details className="group rounded-[10px] border border-line">
        <summary className="cursor-pointer list-none px-4 py-3 text-label font-semibold text-brand-dark marker:hidden">
          <span className="group-open:hidden">Xem lịch trình {plan.weeks.length} tuần ▾</span>
          <span className="hidden group-open:inline">Ẩn lịch trình ▴</span>
        </summary>
        <div className="border-t border-line px-4 py-3">
          <WeekList weeks={plan.weeks} currentWeek={plan.currentWeek} />
        </div>
      </details>

      <p className="text-label text-ink-soft">{paused ? 'Nhắc nhở: tạm ngừng trong lúc kế hoạch tạm dừng' : REMINDER_LINE}</p>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" loading={changingStatus} onClick={() => onStatus(paused ? 'ACTIVE' : 'PAUSED')}>
          {paused ? 'Tiếp tục kế hoạch' : 'Tạm dừng kế hoạch'}
        </Button>
        <Button size="sm" onClick={onAdjust}>
          Điều chỉnh kế hoạch
        </Button>
      </div>
      {currentLevel && currentLevel !== plan.startLevel && (
        <p className="text-xs text-muted">
          Trình độ của bạn đã đổi thành {currentLevel} kể từ khi lập kế hoạch ({plan.startLevel ?? 'chưa xác định'}).
        </p>
      )}
    </section>
  )
}
