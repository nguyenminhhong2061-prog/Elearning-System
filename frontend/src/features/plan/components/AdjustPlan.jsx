import { useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { daysInRange, todayInVietnam } from '@/lib/dates'
import { MAX_PLAN_DAYS, formatDate, planWeeks, weekErrors, withNumberTargets } from '../plan'
import { WeekEditor } from './WeekEditor'

/** Why the new end date cannot be used (scenario 18, branch 6b), or null. */
function endDateError(endDate, startDate, today) {
  if (!endDate) return 'Vui lòng chọn ngày kết thúc.'
  if (endDate < today) return 'Ngày kết thúc không được trước hôm nay.'
  if (endDate <= startDate) return 'Ngày kết thúc phải sau ngày bắt đầu.'
  return daysInRange(startDate, endDate) > MAX_PLAN_DAYS ? 'Kế hoạch dài tối đa 12 tháng.' : null
}

const isOver = (week) => week.status === 'DONE'

/**
 * "Điều chỉnh kế hoạch" (scenario 18, steps 5 to 7): the weeks already over are only shown, the others' targets can be
 * changed, and a new end date drops the weeks after it or adds empty ones to fill in. Nothing is saved before "Lưu".
 *
 * @param {object} props
 * @param {import('../types').StudyPlan} props.plan
 * @param {(change: { endDate: string, weeks: import('../types').PlanWeek[] }) => void} props.onSave
 * @param {boolean} props.saving
 * @param {unknown} props.error failed save
 * @param {() => void} props.onCancel
 * @param {(status: 'ACTIVE' | 'PAUSED' | 'COMPLETED') => void} props.onStatus pause, resume or end (asks first)
 */
export function AdjustPlan({ plan, onSave, saving, error, onCancel, onStatus }) {
  const [endDate, setEndDate] = useState(plan.endDate)
  const [edits, setEdits] = useState({}) // weekNumber -> the fields the learner changed
  const [submitted, setSubmitted] = useState(false)

  const today = todayInVietnam()
  const endError = endDateError(endDate, plan.startDate, today)
  const usedEnd = endError ? plan.endDate : endDate
  const stored = new Map(plan.weeks.map((week) => [week.weekNumber, week]))
  const weeks = planWeeks(plan.startDate, usedEnd).map((week) => {
    const before = stored.get(week.weekNumber)
    const base = before
      ? { ...before, startDate: week.startDate, endDate: week.endDate }
      : { ...week, description: '', targetWords: '', targetExercises: '', status: 'PENDING' }
    return { ...base, ...edits[week.weekNumber] }
  })
  const editable = (week) => !isOver(week)
  const errors = submitted ? weekErrors(weeks, editable) : {}
  const dropped = plan.weeks.length - Math.min(plan.weeks.length, weeks.length)
  const added = weeks.length - Math.min(plan.weeks.length, weeks.length)

  function change(weekNumber, field, value) {
    setEdits((current) => ({ ...current, [weekNumber]: { ...current[weekNumber], [field]: value } }))
  }

  function save() {
    setSubmitted(true)
    if (endError || Object.keys(weekErrors(weeks, editable)).length > 0) return
    const open = withNumberTargets(weeks.filter(editable)).map((week) => ({ ...week, description: week.description.trim() }))
    onSave({ endDate: usedEnd, weeks: open })
  }

  const paused = plan.status === 'PAUSED'

  return (
    <section aria-labelledby="adjust-title" className="flex min-w-0 flex-col gap-4 rounded-xl border-2 border-brand bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="adjust-title" className="text-lg font-semibold text-ink">
          Điều chỉnh kế hoạch
        </h2>
        <p className="text-label text-ink-soft">
          Sửa mục tiêu của các tuần chưa qua hoặc đổi ngày kết thúc. Các tuần đã qua chỉ để xem, kết quả đã học được giữ nguyên.
        </p>
      </div>

      <TextField
        label="Ngày kết thúc"
        type="date"
        min={today}
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        error={endError ?? undefined}
        hint={`Bắt đầu ${formatDate(plan.startDate)} · ${weeks.length} tuần`}
        className="max-w-60"
      />
      {!endError && dropped > 0 && (
        <p className="text-label text-warning">
          Tuần {plan.weeks.length - dropped + 1}
          {dropped > 1 && `–${plan.weeks.length}`} nằm sau ngày kết thúc mới và sẽ bị xóa khỏi lịch trình khi lưu.
        </p>
      )}
      {!endError && added > 0 && (
        <p className="text-label text-ink-soft">
          Đã thêm tuần {plan.weeks.length + 1}
          {added > 1 && `–${weeks.length}`}: nhập nội dung và mục tiêu trước khi lưu.
        </p>
      )}

      <WeekEditor
        weeks={weeks}
        editable={editable}
        describable={(week) => !stored.has(week.weekNumber)}
        errors={errors}
        onChange={change}
        caption="Các tuần của kế hoạch"
      />

      {submitted && Object.keys(errors).length > 0 && (
        <Alert variant="error">Có mục tiêu chưa hợp lệ. Sửa các ô được đánh dấu rồi bấm “Lưu”.</Alert>
      )}
      {error && <Alert variant="error">{describeApiError(error, 'Không lưu được kế hoạch. Vui lòng thử lại.')}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Button onClick={save} loading={saving}>
            Lưu
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Hủy
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => onStatus(paused ? 'ACTIVE' : 'PAUSED')} disabled={saving}>
            {paused ? 'Tiếp tục kế hoạch' : 'Tạm dừng kế hoạch'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onStatus('COMPLETED')} disabled={saving} className="text-danger">
            Kết thúc kế hoạch
          </Button>
        </div>
      </div>
    </section>
  )
}
