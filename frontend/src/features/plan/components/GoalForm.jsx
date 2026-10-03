import { useId, useState } from 'react'
import { CEFR_LEVELS } from '@/api/constants'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { TextField } from '@/components/ui/TextField'
import { cx } from '@/lib/cx'
import { todayInVietnam } from '@/lib/dates'
import { datesForMonths, goalErrors, goalTitle, levelWarning, minutesLabel, planWeeks } from '../plan'

const CUSTOM = 'custom'
const SELECT_CLASS =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-body text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25'

/**
 * One of the design's goal cards ("Đạt B1 trong 3 tháng · 20–30 phút/ngày"), a native radio underneath. Extra fields
 * (`children`) sit under the label, so the radio's accessible name is only the card's title and detail.
 */
function GoalCard({ name, checked, onSelect, title, detail, recommended, children }) {
  return (
    <div
      className={cx(
        'flex flex-col rounded-[10px] border bg-white transition-colors',
        checked ? 'border-brand bg-brand-tint ring-1 ring-brand' : 'border-line hover:border-brand-tint-line',
      )}
    >
      <label className="flex cursor-pointer flex-col gap-1 rounded-[10px] px-4 py-3.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
        <span className="flex items-center justify-between gap-3">
          <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
          <span className={cx('text-body font-semibold', checked ? 'text-brand-dark' : 'text-ink')}>{title}</span>
          {recommended && <Tag variant="brand">Gợi ý</Tag>}
        </span>
        {detail && <span className="text-xs text-muted">{detail}</span>}
      </label>
      {children && <div className="px-4 pb-3.5">{children}</div>}
    </div>
  )
}

/** The level one step above, the usual next goal (A2 when the level is unknown). */
function nextLevel(currentLevel) {
  const index = currentLevel ? CEFR_LEVELS.indexOf(currentLevel) : 0
  return CEFR_LEVELS[Math.min(index + 1, CEFR_LEVELS.length - 1)]
}

/**
 * "Đặt mục tiêu học tập" (scenario 17): a suggested goal fills in the level and the dates, or the learner picks any
 * level; the description is required and the dates bound the plan. "Gợi ý lộ trình" asks the AI for a weekly plan to
 * preview; nothing is saved here. When the AI fails, "Tự lập kế hoạch" opens empty weeks instead (branch 5a).
 *
 * @param {object} props
 * @param {import('../types').GoalOption[]} props.goalOptions
 * @param {string | null} props.currentLevel
 * @param {boolean} props.replacing a plan is active (it will be paused when the new one is applied)
 * @param {{ attemptId: number, targetLevel: string, roadmap: string } | null} props.fromTest branch 2a: the roadmap of a comprehensive test
 * @param {(goal: import('../types').GoalRequest) => void} props.onPreview
 * @param {(goal: import('../types').GoalRequest) => void} props.onManual
 * @param {boolean} props.previewing
 * @param {unknown} props.error failed preview
 * @param {() => void} [props.onCancel] only when a plan exists to go back to
 */
export function GoalForm({ goalOptions, currentLevel, replacing, fromTest, onPreview, onManual, previewing, error, onCancel }) {
  const name = useId()
  const recommended = goalOptions.findIndex((option) => option.recommended)
  const firstChoice = fromTest || goalOptions.length === 0 ? CUSTOM : Math.max(recommended, 0)
  const [choice, setChoice] = useState(firstChoice)
  const [customLevel, setCustomLevel] = useState(fromTest?.targetLevel ?? nextLevel(currentLevel))
  const [description, setDescription] = useState('')
  const [dates, setDates] = useState(() =>
    firstChoice === CUSTOM ? { startDate: '', endDate: '' } : datesForMonths(goalOptions[firstChoice].months, todayInVietnam()),
  )
  const [submitted, setSubmitted] = useState(false)

  const today = todayInVietnam()
  const errors = submitted ? goalErrors({ description, ...dates }, today) : {}
  const targetLevel = choice === CUSTOM ? customLevel : goalOptions[choice].targetLevel
  const dateErrors = goalErrors({ description: '-', ...dates }, today)
  const weekCount = dateErrors.startDate || dateErrors.endDate ? null : planWeeks(dates.startDate, dates.endDate).length
  const warning = choice === CUSTOM ? levelWarning(customLevel, currentLevel) : null

  function selectOption(index) {
    setChoice(index)
    setDates(datesForMonths(goalOptions[index].months, today))
  }

  // Dates typed by hand no longer match "trong 3 tháng": keep the card's level as the learner's own goal.
  function changeDate(field, value) {
    if (choice !== CUSTOM) {
      setCustomLevel(goalOptions[choice].targetLevel)
      setChoice(CUSTOM)
    }
    setDates((current) => ({ ...current, [field]: value }))
  }

  /** The goal to send, or null when a field is wrong (the errors then show under the fields). */
  function validGoal() {
    setSubmitted(true)
    if (Object.keys(goalErrors({ description, ...dates }, today)).length > 0) return null
    return {
      targetLevel,
      startDate: dates.startDate,
      endDate: dates.endDate,
      description: description.trim(),
      ...(fromTest ? { fromAttemptId: fromTest.attemptId } : {}),
    }
  }

  function submit(event) {
    event.preventDefault()
    const goal = validGoal()
    if (goal) onPreview(goal)
  }

  function writeMyself() {
    const goal = validGoal()
    if (goal) onManual(goal)
  }

  const aiDown = error?.status === 503

  return (
    <section aria-labelledby="goal-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface-alt p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="goal-title" className="text-lg font-semibold text-ink">
          {replacing ? 'Đặt lại mục tiêu học tập' : 'Đặt mục tiêu học tập'}
        </h2>
        <p className="text-label text-ink-soft">
          {replacing
            ? 'Chọn mục tiêu mới rồi xem trước lộ trình. Kế hoạch hiện tại sẽ chuyển sang tạm dừng khi bạn bấm “Áp dụng kế hoạch”.'
            : 'Bạn chưa có kế hoạch học. Chọn mục tiêu, trợ lý AI sẽ gợi ý lộ trình theo từng tuần để bạn xem trước.'}
        </p>
      </div>

      {fromTest?.roadmap && (
        <div className="flex flex-col gap-1 rounded-[10px] border border-brand-tint-line bg-white px-4 py-3">
          <span className="text-label font-semibold text-brand-dark">Lộ trình đề xuất từ bài kiểm tra tổng hợp</span>
          <p className="text-label whitespace-pre-line text-ink-soft">{fromTest.roadmap}</p>
          <span className="text-xs text-muted">Trợ lý AI sẽ chia lộ trình này theo từng tuần.</span>
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Mục tiêu</legend>
          {goalOptions.map((option, index) => (
            <GoalCard
              key={`${option.targetLevel}-${option.months}`}
              name={name}
              checked={choice === index}
              onSelect={() => selectOption(index)}
              title={goalTitle(option, currentLevel)}
              detail={minutesLabel(option.dailyMinutes)}
              recommended={option.recommended}
            />
          ))}
          <GoalCard
            name={name}
            checked={choice === CUSTOM}
            onSelect={() => setChoice(CUSTOM)}
            title="Mục tiêu khác"
            detail={choice === CUSTOM ? null : 'Tự chọn trình độ và thời gian'}
          >
            {choice === CUSTOM && (
              <div className="flex flex-col gap-1">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink-soft">Trình độ mục tiêu</span>
                  <select value={customLevel} onChange={(event) => setCustomLevel(event.target.value)} className={SELECT_CLASS}>
                    {CEFR_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level === currentLevel ? `${level} (giữ vững)` : level}
                      </option>
                    ))}
                  </select>
                </label>
                {warning && (
                  <span aria-live="polite" className="text-xs text-warning">
                    {warning}
                  </span>
                )}
              </div>
            )}
          </GoalCard>
        </fieldset>

        <TextField
          label="Mô tả mục tiêu"
          placeholder="Ví dụ: Đạt B2 để phỏng vấn học bổng vào tháng 1/2027"
          maxLength={255}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Ngày bắt đầu"
            type="date"
            min={today}
            value={dates.startDate}
            onChange={(event) => changeDate('startDate', event.target.value)}
            error={errors.startDate}
          />
          <TextField
            label="Ngày kết thúc"
            type="date"
            min={dates.startDate || today}
            value={dates.endDate}
            onChange={(event) => changeDate('endDate', event.target.value)}
            error={errors.endDate}
            hint={weekCount ? `${weekCount} tuần` : undefined}
          />
        </div>

        {error && (
          <Alert variant="error" className="flex flex-col items-start gap-2">
            <span>
              {aiDown
                ? 'Trợ lý AI chưa gợi ý được lộ trình lúc này. Vui lòng thử lại sau.'
                : describeApiError(error, 'Chưa gợi ý được lộ trình. Vui lòng thử lại.')}
            </span>
            {aiDown && <span className="font-normal">Bạn có thể bấm “Gợi ý lộ trình” lần nữa, hoặc tự lập kế hoạch theo từng tuần.</span>}
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={previewing}>
            {previewing ? 'Đang tạo lộ trình…' : 'Gợi ý lộ trình'}
          </Button>
          {aiDown && !previewing && (
            <Button type="button" variant="outline" onClick={writeMyself}>
              Tự lập kế hoạch
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={previewing}>
              Hủy
            </Button>
          )}
        </div>
      </form>
    </section>
  )
}
