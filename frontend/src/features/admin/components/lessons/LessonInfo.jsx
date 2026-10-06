import { CEFR_LEVELS } from '@/api/constants'
import { cx } from '@/lib/cx'
import { LESSON_SKILLS, SKILL_LABELS } from '../../constants'
import { Segmented } from '../controls'
import { InputField, SelectField, TextAreaField } from '../fields'

export const LESSON_CARD = 'flex flex-col gap-4 rounded-xl border border-line bg-white px-5.5 py-5'

const DIFFICULTIES = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Vừa' },
  { value: 'HARD', label: 'Khó' },
]
const STATUSES = [
  { value: 'DRAFT', label: 'Nháp', note: 'Người học chưa thấy bài.' },
  { value: 'PUBLISHED', label: 'Đã xuất bản', note: 'Hiện ngay trong danh sách bài tập của người học.' },
  { value: 'HIDDEN', label: 'Lưu trữ', note: 'Ẩn với người học, giữ lịch sử làm bài.' },
]

/**
 * Scenario 23, step 4: title, skill, level, topic, difficulty, time and status. A new lesson may be published at once
 * (step 11); "Lưu trữ" only exists for a lesson that has been saved.
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {Record<string, string>} props.errors
 * @param {boolean} props.isNew
 * @param {(draft: object) => void} props.onChange
 * @param {(skill: string) => void} props.onChangeSkill only while the lesson is new
 * @param {() => void} props.onDelete
 */
export function LessonInfo({ draft, errors, isNew, onChange, onChangeSkill, onDelete }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value })
  return (
    <section aria-labelledby="lesson-info" className={cx(LESSON_CARD, 'self-start')}>
      <h2 id="lesson-info" className="text-base font-bold text-ink">
        Thông tin bài
      </h2>
      <InputField label="Tiêu đề *" value={draft.title} onChange={set('title')} error={errors.title} maxLength={150} />
      <TextAreaField label="Mô tả" rows={3} value={draft.description} onChange={set('description')} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Kỹ năng"
          value={draft.skill}
          disabled={!isNew}
          hint="Không đổi được sau khi tạo."
          onChange={(event) => onChangeSkill(event.target.value)}
          options={LESSON_SKILLS.map((skill) => ({ value: skill, label: SKILL_LABELS[skill] }))}
        />
        <SelectField
          label="Trình độ *"
          value={draft.cefrLevel}
          onChange={set('cefrLevel')}
          error={errors.cefrLevel}
          options={[{ value: '', label: 'Chọn' }, ...CEFR_LEVELS.map((level) => ({ value: level, label: level }))]}
        />
      </div>
      <InputField label="Chủ đề (không bắt buộc)" value={draft.topic} onChange={set('topic')} placeholder="Ví dụ: Cấu trúc câu" />
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-label font-medium text-ink-soft">Độ khó</legend>
        <Segmented label="Độ khó" options={DIFFICULTIES} value={draft.difficulty} onChange={(difficulty) => onChange({ ...draft, difficulty })} className="self-start" />
      </fieldset>
      <InputField
        label="Thời gian ước tính (phút)"
        type="number"
        min={1}
        inputMode="numeric"
        value={draft.estimatedMinutes ?? ''}
        error={errors.estimatedMinutes}
        onChange={(event) => onChange({ ...draft, estimatedMinutes: event.target.value === '' ? null : Number(event.target.value) })}
        className="[&_input]:w-28"
      />
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-label font-medium text-ink-soft">Trạng thái</legend>
        {STATUSES.filter((status) => !isNew || status.value !== 'HIDDEN').map((status) => (
          <label
            key={status.value}
            className={cx(
              'flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-3 has-focus-visible:outline-2 has-focus-visible:outline-brand',
              draft.status === status.value ? 'border-brand-dark bg-brand-tint' : 'border-line hover:bg-surface-alt',
            )}
          >
            <input
              type="radio"
              name="lesson-status"
              value={status.value}
              checked={draft.status === status.value}
              onChange={() => onChange({ ...draft, status: status.value })}
              className="mt-0.5 size-4 accent-brand-dark"
            />
            <span className="flex flex-col gap-0.5 text-label">
              <strong className="text-ink">{status.label}</strong>
              <span className="text-muted-strong">{status.note}</span>
            </span>
          </label>
        ))}
        {errors.items && draft.status === 'PUBLISHED' && <p className="text-xs text-danger">{errors.items}</p>}
      </fieldset>
      {!isNew && (
        <button
          type="button"
          onClick={onDelete}
          className="self-start cursor-pointer rounded-md px-2 py-1.5 text-label font-bold text-danger hover:bg-danger-bg focus-visible:outline-2 focus-visible:outline-brand"
        >
          Xóa bài tập…
        </button>
      )}
    </section>
  )
}
