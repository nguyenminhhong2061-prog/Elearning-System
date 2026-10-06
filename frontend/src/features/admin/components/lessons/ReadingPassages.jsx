import { cx } from '@/lib/cx'
import { move, removeAt, replaceAt } from '../../utils/draft'
import { newPassage } from '../../utils/lessonDraft'
import { InputField, TextAreaField } from '../fields'
import { LESSON_CARD } from './LessonInfo'

const SMALL_BUTTON = 'size-8 cursor-pointer rounded-md border border-line text-sm disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Scenario 23, steps 5–6: the passages of a reading lesson, each with a title and its text. Questions point at them
 * ("Bài đọc liên quan"); removing a passage unlinks its questions instead of leaving them pointing at nothing.
 *
 * @param {object} props
 * @param {object} props.draft
 * @param {Record<string, Record<string, string>>} props.errors problems of each passage, by key
 * @param {(draft: object) => void} props.onChange
 */
export function ReadingPassages({ draft, errors, onChange }) {
  const passages = draft.readingPassages
  const setPassages = (next) => onChange({ ...draft, readingPassages: next })

  function remove(index) {
    const key = passages[index].key
    onChange({
      ...draft,
      readingPassages: removeAt(passages, index),
      questions: draft.questions.map((question) => (question.passageKey === key ? { ...question, passageKey: null } : question)),
    })
  }

  return (
    <section aria-labelledby="lesson-passages" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lesson-passages" className="text-base font-bold text-ink">
          Bài đọc ({passages.length})
        </h2>
        <span className="text-label text-muted-strong">Người học đọc bài ở cột trái khi làm các câu hỏi gắn với bài</span>
      </div>
      {passages.length === 0 && (
        <p className="rounded-xl border border-line bg-white px-5 py-4 text-label text-ink-soft">
          Chưa có bài đọc. Bài chỉ gồm câu ngữ pháp thì không cần bài đọc.
        </p>
      )}
      {passages.map((passage, index) => {
        const passageErrors = errors[passage.key] ?? {}
        const number = index + 1
        const update = (change) => setPassages(replaceAt(passages, index, { ...passage, ...change }))
        return (
          <article key={passage.key} aria-label={`Bài đọc ${number}`} className={cx(LESSON_CARD, Object.keys(passageErrors).length > 0 && 'border-danger-solid')}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">Bài đọc {number}</h3>
              <div className="ml-auto flex gap-1">
                <button type="button" aria-label={`Chuyển bài đọc ${number} lên`} disabled={index === 0} onClick={() => setPassages(move(passages, index, -1))} className={SMALL_BUTTON}>
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Chuyển bài đọc ${number} xuống`}
                  disabled={index === passages.length - 1}
                  onClick={() => setPassages(move(passages, index, 1))}
                  className={SMALL_BUTTON}
                >
                  ↓
                </button>
                <button type="button" onClick={() => remove(index)} className="cursor-pointer rounded-md px-2.5 text-label font-bold text-danger hover:bg-danger-bg">
                  Xóa bài đọc
                </button>
              </div>
            </div>
            <InputField label="Tiêu đề bài đọc *" lang="en" value={passage.title} error={passageErrors.title} onChange={(event) => update({ title: event.target.value })} />
            <TextAreaField
              label="Nội dung *"
              lang="en"
              rows={8}
              hint="Các đoạn văn cách nhau bằng một dòng trống."
              value={passage.content}
              error={passageErrors.content}
              onChange={(event) => update({ content: event.target.value })}
            />
          </article>
        )
      })}
      <button
        type="button"
        onClick={() => setPassages([...passages, newPassage()])}
        className="cursor-pointer rounded-xl border-[1.5px] border-dashed border-brand-tint-line bg-white px-5 py-4 text-label font-bold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
      >
        + Thêm bài đọc
      </button>
    </section>
  )
}
