import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { useChangePlanStatus } from '../api/planQueries'
import { currentWeekOf, formatDate, formatRange, goalTitle, lastMissedWeek, minutesLabel, share } from '../plan'
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

/**
 * "Kế hoạch của bạn": the goal, this week's targets and progress, the D2 warning when the last week fell short (no
 * penalty, just a suggestion to adjust), the whole schedule, and pausing or resuming.
 *
 * @param {object} props
 * @param {import('../types').StudyPlan} props.plan
 * @param {string | null} props.currentLevel
 * @param {() => void} props.onAdjust opens the goal form
 */
export function PlanOverview({ plan, currentLevel, onAdjust }) {
  const changeStatus = useChangePlanStatus()
  const status = STATUS[plan.status] ?? STATUS.ACTIVE
  const week = currentWeekOf(plan)
  const missed = plan.status === 'ACTIVE' ? lastMissedWeek(plan) : null
  const paused = plan.status === 'PAUSED'

  return (
    <section aria-labelledby="plan-title" className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="plan-title" className="text-lg font-semibold text-ink">
            Kế hoạch của bạn
          </h2>
          <p className="text-xl font-bold text-brand-dark">{goalTitle(plan.goal, plan.startLevel)}</p>
          <p className="text-label text-muted">
            {formatDate(plan.startDate)} – {formatDate(plan.endDate)} · {minutesLabel(plan.dailyMinutes)}
          </p>
          {plan.goal.note && <p className="text-label text-ink-soft">Mục tiêu của bạn: “{plan.goal.note}”</p>}
        </div>
        <Tag variant={status.variant}>{status.label}</Tag>
      </div>

      {paused && (
        <Alert variant="info">Kế hoạch đang tạm dừng. Tiếp tục bất cứ lúc nào, các tuần vẫn giữ nguyên ngày.</Alert>
      )}

      {missed && (
        <Alert variant="warning" className="flex flex-col items-start gap-2 font-normal">
          <span>
            <strong>Tuần {missed.weekNumber} chưa đạt mục tiêu</strong> ({missed.wordsDone}/{missed.targetWords} từ,{' '}
            {missed.exercisesDone}/{missed.targetExercises} bài tập). Không sao, kế hoạch vẫn tiếp tục. Nếu mục tiêu đang
            quá sức, bạn có thể đặt lại mục tiêu với thời gian dài hơn.
          </span>
          <button type="button" onClick={onAdjust} className="cursor-pointer font-semibold underline">
            Điều chỉnh mục tiêu
          </button>
        </Alert>
      )}

      {week ? (
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
          <button type="button" onClick={onAdjust} className="cursor-pointer font-semibold underline">
            Đặt mục tiêu mới
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

      {changeStatus.isError && (
        <Alert variant="error">{describeApiError(changeStatus.error, 'Không đổi được trạng thái kế hoạch. Vui lòng thử lại.')}</Alert>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={onAdjust}>
          Đặt lại mục tiêu
        </Button>
        <Button
          variant="outline"
          size="sm"
          loading={changeStatus.isPending}
          onClick={() => changeStatus.mutate(paused ? 'ACTIVE' : 'PAUSED')}
        >
          {paused ? 'Tiếp tục kế hoạch' : 'Tạm dừng kế hoạch'}
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
