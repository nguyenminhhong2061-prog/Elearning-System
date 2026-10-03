import { cx } from '@/lib/cx'
import { formatRange } from '../plan'

const FIELDS = [
  { id: 'targetWords', label: 'Mục tiêu số từ mới', done: 'wordsDone', unit: 'từ' },
  { id: 'targetExercises', label: 'Mục tiêu số bài tập', done: 'exercisesDone', unit: 'bài' },
]

function TargetCell({ week, field, editable, error, onChange }) {
  const errorId = `week-${week.weekNumber}-${field.id}-error`
  if (!editable) {
    return (
      <td className="px-3 py-2 align-top tabular-nums">
        {week[field.id]}
        {week.status === 'DONE' && (
          <span className="block text-xs text-muted">
            Đã làm {week[field.done]} {field.unit}
          </span>
        )}
      </td>
    )
  }
  return (
    <td className="px-3 py-2 align-top">
      <input
        inputMode="numeric"
        value={week[field.id]}
        onChange={(event) => onChange(week.weekNumber, field.id, event.target.value)}
        aria-label={`${field.label} tuần ${week.weekNumber}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cx(
          'w-20 rounded-lg border bg-white px-2.5 py-1.5 text-label text-ink tabular-nums outline-none focus:ring-2',
          error ? 'border-danger-solid focus:ring-danger-solid/20' : 'border-line focus:border-brand focus:ring-brand/25',
        )}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </td>
  )
}

/**
 * The weeks of a plan as a table whose targets can be changed (scenario 17 step 6, scenario 18 step 5). Weeks already
 * over stay read-only with what was done; a week without content (a plan the learner writes, or a week added by a
 * later end date) lets them type it.
 *
 * @param {object} props
 * @param {Array<import('../types').PlanWeek & { targetWords: number | string, targetExercises: number | string }>} props.weeks
 * @param {(week: object) => boolean} [props.editable]
 * @param {(week: object) => boolean} [props.describable] the content of this week can be typed
 * @param {Record<number, { targetWords?: string, targetExercises?: string }>} props.errors shown under the inputs
 * @param {(weekNumber: number, field: string, value: string) => void} props.onChange
 * @param {string} props.caption
 */
export function WeekEditor({ weeks, editable = () => true, describable = () => false, errors, onChange, caption }) {
  return (
    <div className="max-h-[30rem] overflow-auto rounded-[10px] border border-line">
      <table className="w-full min-w-150 text-label text-ink">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-alt text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              Tuần
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              Thời gian
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              Nội dung học
            </th>
            {FIELDS.map((field) => (
              <th key={field.id} scope="col" className="px-3 py-2 text-left font-semibold">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {weeks.map((week) => {
            const canEdit = editable(week)
            return (
              <tr key={week.weekNumber} className={cx(!canEdit && 'bg-surface-alt/60')}>
                <th scope="row" className="px-3 py-2 text-left align-top font-semibold">
                  {week.weekNumber}
                </th>
                <td className="px-3 py-2 align-top whitespace-nowrap text-ink-soft">{formatRange(week.startDate, week.endDate)}</td>
                <td className="px-3 py-2 align-top text-ink-soft">
                  {canEdit && describable(week) ? (
                    <input
                      value={week.description}
                      maxLength={255}
                      placeholder="Tự nhập nội dung học"
                      onChange={(event) => onChange(week.weekNumber, 'description', event.target.value)}
                      aria-label={`Nội dung học tuần ${week.weekNumber}`}
                      className="w-full min-w-40 rounded-lg border border-line bg-white px-2.5 py-1.5 text-label text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                    />
                  ) : (
                    week.description
                  )}
                </td>
                {FIELDS.map((field) => (
                  <TargetCell
                    key={field.id}
                    week={week}
                    field={field}
                    editable={canEdit}
                    error={errors[week.weekNumber]?.[field.id]}
                    onChange={onChange}
                  />
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
