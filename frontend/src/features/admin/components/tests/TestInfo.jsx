import { cx } from '@/lib/cx'
import { InputField, SelectField, TextAreaField } from '../fields'

/**
 * Scenario 24, step 4: name, type, skills covered, instructions, dates and status of a test. Once learners have
 * submitted it (`locked`), only the name, the closing date and showing or hiding it can change (branch 2a).
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {Record<string, string>} props.errors
 * @param {boolean} props.isNew
 * @param {boolean} props.locked
 * @param {(draft: object) => void} props.onChange
 * @param {(type: string) => void} props.onChangeType only while the test is new
 * @param {() => void} [props.onDelete]
 */
export function TestInfo({ draft, errors, isNew, locked, onChange, onChangeType, onDelete }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value })
  const periodic = draft.type === 'PERIODIC'
  const statuses = [
    { value: 'DRAFT', label: 'Nháp', note: 'Người học chưa thấy đề.', disabled: locked },
    { value: 'VISIBLE', label: 'Mở theo lịch', note: 'Hiện với người học từ ngày mở đến hết ngày đóng.' },
    ...(isNew ? [] : [{ value: 'HIDDEN', label: 'Ẩn', note: 'Người học không thấy đề; kết quả đã nộp được giữ.' }]),
  ]

  return (
    <section aria-labelledby="test-info" className="flex flex-col gap-4 self-start rounded-xl border border-line bg-white px-5.5 py-5">
      <h2 id="test-info" className="text-base font-bold text-ink">
        Thông tin đề
      </h2>
      <InputField label="Tên đề *" value={draft.title} error={errors.title} onChange={set('title')} />
      <SelectField
        label="Loại đề"
        value={draft.type}
        disabled={!isNew}
        onChange={(event) => onChangeType(event.target.value)}
        options={[
          { value: 'PERIODIC', label: 'Định kỳ' },
          { value: 'COMPREHENSIVE', label: 'Tổng hợp 4 kỹ năng' },
        ]}
      />
      <InputField label="Kỹ năng" placeholder="Ví dụ: Từ vựng và ngữ pháp" disabled={locked} value={draft.skillText} onChange={set('skillText')} hint="Nội dung của đề, hiện ở trang giới thiệu đề." />
      <TextAreaField label="Hướng dẫn làm bài" rows={3} disabled={locked} value={draft.instruction} onChange={set('instruction')} placeholder="Ví dụ: Câu bỏ trống tính là sai." />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Ngày mở *" inputMode="numeric" placeholder="dd/mm/yyyy" disabled={locked} value={draft.startText} error={errors.startDate} onChange={set('startText')} />
        <InputField label="Ngày đóng *" inputMode="numeric" placeholder="dd/mm/yyyy" value={draft.endText} error={errors.endDate} onChange={set('endText')} />
      </div>
      {!errors.endDate && (
        <p className="-mt-2 text-xs text-muted-strong">
          {periodic ? 'Đề mở từ đầu ngày mở đến hết ngày đóng.' : 'Đề tổng hợp cần đủ 4 kỹ năng; kết quả đổi trình độ người học.'} Ngày đóng phải sau ngày mở.
        </p>
      )}
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-label font-medium text-ink-soft">Trạng thái</legend>
        {statuses.map((status) => (
          <label
            key={status.value}
            className={cx(
              'flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-3 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-brand',
              draft.status === status.value ? 'border-brand-dark bg-brand-tint' : 'border-line hover:bg-surface-alt',
            )}
          >
            <input
              type="radio"
              name="test-status"
              checked={draft.status === status.value}
              disabled={status.disabled}
              onChange={() => onChange({ ...draft, status: status.value })}
              className="mt-0.5 size-4 accent-brand-dark"
            />
            <span className="flex flex-col gap-0.5 text-label">
              <strong className="text-ink">{status.label}</strong>
              <span className="text-muted-strong">{status.note}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="self-start cursor-pointer rounded-md px-2 py-1.5 text-label font-bold text-danger hover:bg-danger-bg focus-visible:outline-2 focus-visible:outline-brand"
        >
          Xóa đề…
        </button>
      )}
    </section>
  )
}
