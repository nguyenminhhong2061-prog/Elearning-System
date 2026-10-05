import { cx } from '@/lib/cx'
import { move, removeAt, replaceAt } from '../../utils/draft'
import { newItem } from '../../utils/lessonDraft'
import { InputField, MediaPicker } from '../fields'
import { LESSON_CARD } from './LessonInfo'

const SMALL_BUTTON = 'size-8 cursor-pointer rounded-md border border-line text-sm disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Scenario 23, branch 3c: the model sentences of a pronunciation lesson. The sentence, its IPA and the model audio are
 * required (the learner listens before reading aloud); the reading notes are not.
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {{ items?: string, itemErrors: Record<string, Record<string, string>> }} props.errors
 * @param {(draft: object) => void} props.onChange
 */
export function PronunciationItems({ draft, errors, onChange }) {
  const items = draft.pronunciationItems
  const setItems = (next) => onChange({ ...draft, pronunciationItems: next })
  return (
    <section aria-labelledby="lesson-items" className="flex flex-col gap-3">
      <h2 id="lesson-items" className="text-base font-bold text-ink">
        Câu mẫu ({items.length})
      </h2>
      {errors.items && items.length === 0 && <p className="text-label font-semibold text-danger">{errors.items}</p>}
      {items.map((item, index) => {
        const itemErrors = errors.itemErrors[item.key] ?? {}
        const number = index + 1
        const update = (change) => setItems(replaceAt(items, index, { ...item, ...change }))
        return (
          <article key={item.key} aria-label={`Câu mẫu ${number}`} className={cx(LESSON_CARD, Object.keys(itemErrors).length > 0 && 'border-danger-solid')}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">Câu mẫu {number}</h3>
              <div className="ml-auto flex gap-1">
                <button type="button" aria-label={`Chuyển câu mẫu ${number} lên`} disabled={index === 0} onClick={() => setItems(move(items, index, -1))} className={SMALL_BUTTON}>
                  ↑
                </button>
                <button type="button" aria-label={`Chuyển câu mẫu ${number} xuống`} disabled={index === items.length - 1} onClick={() => setItems(move(items, index, 1))} className={SMALL_BUTTON}>
                  ↓
                </button>
                <button type="button" onClick={() => setItems(removeAt(items, index))} className="cursor-pointer rounded-md px-2.5 text-label font-bold text-danger hover:bg-danger-bg">
                  Xóa
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField label="Câu hoặc từ *" lang="en" value={item.text} error={itemErrors.text} onChange={(event) => update({ text: event.target.value })} />
              <InputField label="Phiên âm IPA *" lang="en" value={item.ipa} error={itemErrors.ipa} onChange={(event) => update({ ipa: event.target.value })} placeholder="/ˈʃedjuːl/" />
            </div>
            <InputField label="Ghi chú cách đọc (không bắt buộc)" value={item.notes} onChange={(event) => update({ notes: event.target.value })} />
            <MediaPicker
              kind="AUDIO"
              label="Âm thanh mẫu *"
              value={item.audioUrl}
              onChange={(audioUrl) => update({ audioUrl })}
              maxBytes={1024 * 1024}
              emptyTitle="Chưa có âm thanh mẫu"
              emptyNote="Người học nghe câu mẫu trước khi đọc theo."
              error={itemErrors.audioUrl}
            />
          </article>
        )
      })}
      <button
        type="button"
        onClick={() => setItems([...items, newItem()])}
        className="cursor-pointer rounded-xl border-[1.5px] border-dashed border-brand-tint-line bg-white px-5 py-4 text-label font-bold text-brand-dark hover:bg-brand-tint"
      >
        + Thêm câu mẫu
      </button>
    </section>
  )
}
