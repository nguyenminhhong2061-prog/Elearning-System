import { useId, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { TextField } from '@/components/ui/TextField'
import { cx } from '@/lib/cx'
import { MONTH_CHOICES, goalTitle, minutesLabel, targetLevels } from '../plan'

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

/**
 * "Đặt mục tiêu học tập" (D2: when there is no plan the system asks for a goal): the suggested goals as the design's
 * cards, or the learner's own level and duration, plus an optional note. "Gợi ý lộ trình" asks the AI for a weekly
 * plan to preview; nothing is saved here.
 *
 * @param {object} props
 * @param {import('../types').GoalOption[]} props.goalOptions
 * @param {string | null} props.currentLevel
 * @param {boolean} props.replacing a plan already exists (the new one will replace it)
 * @param {(goal: { targetLevel: string, months: number, note: string | null }) => void} props.onPreview
 * @param {boolean} props.previewing
 * @param {unknown} props.error failed preview
 * @param {() => void} [props.onCancel] only when a plan exists to go back to
 */
export function GoalForm({ goalOptions, currentLevel, replacing, onPreview, previewing, error, onCancel }) {
  const name = useId()
  const levels = targetLevels(currentLevel)
  const recommended = goalOptions.findIndex((option) => option.recommended)
  const [choice, setChoice] = useState(() => (goalOptions.length > 0 ? Math.max(recommended, 0) : CUSTOM))
  const [custom, setCustom] = useState(() => ({ targetLevel: levels[Math.min(1, levels.length - 1)], months: 3 }))
  const [note, setNote] = useState('')

  function submit(event) {
    event.preventDefault()
    const goal = choice === CUSTOM ? custom : goalOptions[choice]
    onPreview({ targetLevel: goal.targetLevel, months: goal.months, note: note.trim() || null })
  }

  return (
    <section aria-labelledby="goal-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface-alt p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="goal-title" className="text-lg font-semibold text-ink">
          {replacing ? 'Đặt lại mục tiêu học tập' : 'Đặt mục tiêu học tập'}
        </h2>
        <p className="text-label text-ink-soft">
          {replacing
            ? 'Chọn mục tiêu mới rồi xem trước lộ trình. Kế hoạch hiện tại chỉ được thay khi bạn bấm "Áp dụng kế hoạch".'
            : 'Bạn chưa có kế hoạch học. Chọn mục tiêu, trợ lý AI sẽ gợi ý lộ trình theo từng tuần để bạn xem trước.'}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Mục tiêu</legend>
          {goalOptions.map((option, index) => (
            <GoalCard
              key={`${option.targetLevel}-${option.months}`}
              name={name}
              checked={choice === index}
              onSelect={() => setChoice(index)}
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
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink-soft">Trình độ mục tiêu</span>
                  <select
                    value={custom.targetLevel}
                    onChange={(event) => setCustom((current) => ({ ...current, targetLevel: event.target.value }))}
                    className={SELECT_CLASS}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level === currentLevel ? `${level} (giữ vững)` : level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink-soft">Thời gian</span>
                  <select
                    value={custom.months}
                    onChange={(event) => setCustom((current) => ({ ...current, months: Number(event.target.value) }))}
                    className={SELECT_CLASS}
                  >
                    {MONTH_CHOICES.map((months) => (
                      <option key={months} value={months}>
                        {months} tháng
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </GoalCard>
        </fieldset>

        <TextField
          label="Ghi chú mục tiêu (không bắt buộc)"
          placeholder="Ví dụ: giao tiếp khi đi du lịch"
          maxLength={255}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {error && (
          <Alert variant="error">
            {error.status === 503
              ? 'Trợ lý AI chưa gợi ý được lộ trình lúc này. Vui lòng thử lại sau.'
              : describeApiError(error, 'Chưa gợi ý được lộ trình. Vui lòng thử lại.')}
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={previewing}>
            Gợi ý lộ trình
          </Button>
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
