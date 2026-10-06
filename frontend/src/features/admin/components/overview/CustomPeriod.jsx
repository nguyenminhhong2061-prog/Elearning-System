import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { addDays, formatDayMonth } from '@/lib/dates'
import { cx } from '@/lib/cx'
import { parseTypedDate } from '../../utils/format'

const typed = (isoDate) => `${formatDayMonth(isoDate)}/${isoDate.slice(0, 4)}`

/**
 * Scenario 26, step 3 and branch 3a: "Từ ngày", "Đến ngày" and "Xem".
 *
 * @param {object} props
 * @param {{ from: string, to: string }} props.initial the period shown now
 * @param {string} props.today
 * @param {(period: { from: string, to: string }) => void} props.onApply
 * @param {() => void} props.onCancel
 */
export function CustomPeriod({ initial, today, onApply, onCancel }) {
  const [from, setFrom] = useState(typed(initial.from))
  const [to, setTo] = useState(typed(initial.to))
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
        Xem
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
