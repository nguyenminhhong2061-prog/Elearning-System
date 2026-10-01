import { useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { levelPath, minutesLabel, periodLine, weekErrors, withNumberTargets } from '../plan'
import { WeekEditor } from './WeekEditor'

/**
 * The weekly plan for the chosen goal, before it is saved (scenario 17, steps 6 to 8): the AI's draft, or empty weeks
 * the learner fills in (branch 5a). Each week's targets can be changed; "Áp dụng kế hoạch" saves it once every target
 * is a whole number. Remount it (a new `key`) for a new draft.
 *
 * @param {object} props
 * @param {import('../types').PlanDraft} props.draft
 * @param {boolean} props.manual the learner writes the weeks themselves
 * @param {boolean} props.replacing
 * @param {(draft: import('../types').PlanDraft) => void} props.onApply
 * @param {boolean} props.applying
 * @param {unknown} props.error failed save
 */
export function PlanPreview({ draft, manual, replacing, onApply, applying, error }) {
  const [weeks, setWeeks] = useState(draft.weeks)
  const [submitted, setSubmitted] = useState(false)
  const errors = submitted ? weekErrors(weeks) : {}
  const invalid = Object.keys(errors).length > 0

  function change(weekNumber, field, value) {
    setWeeks((current) => current.map((week) => (week.weekNumber === weekNumber ? { ...week, [field]: value } : week)))
  }

  function apply() {
    setSubmitted(true)
    if (Object.keys(weekErrors(weeks)).length > 0) return
    onApply({ ...draft, weeks: withNumberTargets(weeks).map((week) => ({ ...week, description: week.description.trim() })) })
  }

  const details = [periodLine(draft.startDate, draft.endDate, weeks.length), levelPath(draft.startLevel, draft.goal.targetLevel)]
  if (draft.dailyMinutes) details.push(minutesLabel(draft.dailyMinutes))

  return (
    <section aria-labelledby="preview-title" className="flex min-w-0 flex-col gap-4 rounded-xl border-2 border-brand bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="preview-title" className="text-lg font-semibold text-ink">
          {manual ? 'Tự lập kế hoạch' : 'Lộ trình gợi ý'}
        </h2>
        <p className="text-label text-muted">{details.join(' · ')}</p>
        <p className="text-label text-ink-soft">Mục tiêu: “{draft.goal.description}”</p>
      </div>

      {draft.summary && <p className="text-body whitespace-pre-line text-ink-soft">{draft.summary}</p>}

      <WeekEditor
        weeks={weeks}
        describable={() => manual}
        errors={errors}
        onChange={change}
        caption={manual ? 'Các tuần của kế hoạch tự lập' : 'Các tuần của lộ trình gợi ý'}
      />

      {invalid && <Alert variant="error">Có mục tiêu chưa hợp lệ. Sửa các ô được đánh dấu rồi bấm “Áp dụng kế hoạch”.</Alert>}
      {error && <Alert variant="error">{describeApiError(error, 'Không lưu được kế hoạch. Vui lòng thử lại.')}</Alert>}

      <div className="flex flex-col gap-2">
        <Button onClick={apply} loading={applying} className="self-start">
          Áp dụng kế hoạch
        </Button>
        <p className="text-xs text-muted">
          {manual
            ? 'Nhập nội dung và mục tiêu số từ mới, số bài tập cho từng tuần.'
            : 'Muốn khác, đổi mục tiêu ở trên rồi bấm “Gợi ý lộ trình” lần nữa.'}
          {replacing && ' Kế hoạch hiện tại sẽ chuyển sang tạm dừng.'}
        </p>
      </div>
    </section>
  )
}
