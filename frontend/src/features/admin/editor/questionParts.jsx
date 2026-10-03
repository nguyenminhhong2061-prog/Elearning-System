import { useId } from 'react'
import { cx } from '@/lib/cx'
import { blankOption, removeAt, replaceAt } from './draft'

const LETTERS = 'ABCDEF'
const MAX_OPTIONS = 6
const SMALL_INPUT =
  'min-w-0 flex-1 rounded-lg border bg-white px-3 py-2.25 text-sm text-ink outline-none focus:ring-2 disabled:bg-surface-alt disabled:text-muted'
const tone = (error) => (error ? 'border-danger-solid focus:ring-danger-solid/20' : 'border-line focus:border-brand focus:ring-brand/25')

/**
 * Choices of a multiple-choice question: a radio marks the one correct answer, each text is editable, rows can be
 * removed (at least two stay) and added (up to six).
 *
 * @param {object} props
 * @param {{ key: string, text: string, correct: boolean }[]} props.options
 * @param {(options: object[]) => void} props.onChange
 * @param {string} [props.error] problem of the whole list ("chọn đáp án đúng")
 * @param {boolean} [props.locked] answers cannot change (a test with submissions): texts stay editable
 * @param {string} [props.lang] language of the choices
 */
export function OptionsEditor({ options, onChange, error, locked = false, lang }) {
  const name = useId()
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-label font-medium text-ink-soft">Lựa chọn (chọn 1 đáp án đúng)</legend>
      {options.map((option, index) => {
        const letter = LETTERS[index]
        return (
          <div key={option.key} className={cx('flex items-center gap-2.5 rounded-lg px-2 py-1', option.correct && 'bg-success-bg')}>
            <input
              type="radio"
              name={name}
              checked={option.correct}
              disabled={locked}
              onChange={() => onChange(options.map((other, position) => ({ ...other, correct: position === index })))}
              aria-label={`${letter} là đáp án đúng`}
              className="size-4.5 flex-none accent-brand-dark"
            />
            <span aria-hidden="true" className="w-4 flex-none text-label font-bold text-ink-soft">
              {letter}
            </span>
            <input
              value={option.text}
              lang={lang}
              onChange={(event) => onChange(replaceAt(options, index, { ...option, text: event.target.value }))}
              aria-label={`Nội dung lựa chọn ${letter}`}
              aria-invalid={error && !option.text.trim() ? true : undefined}
              className={cx(SMALL_INPUT, tone(error && !option.text.trim()))}
            />
            {option.correct && <span className="flex-none text-xs font-bold text-success">Đáp án đúng</span>}
            <button
              type="button"
              disabled={locked || options.length <= 2}
              onClick={() => onChange(removeAt(options, index))}
              aria-label={`Bỏ lựa chọn ${letter}`}
              className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-md text-lg text-ink-soft hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-30"
            >
              ×
            </button>
          </div>
        )
      })}
      {!locked && options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={() => onChange([...options, blankOption()])}
          className="self-start cursor-pointer rounded-md px-2 py-1.5 text-label font-bold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
        >
          + Thêm lựa chọn
        </button>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}

/**
 * Answers accepted for a fill-in question, compared after trimming and ignoring case (docs/api/exercises.md).
 * @param {{ answers: string[], onChange: (answers: string[]) => void, error?: string, locked?: boolean }} props
 */
export function AcceptedAnswersEditor({ answers, onChange, error, locked = false }) {
  const list = answers.length > 0 ? answers : ['']
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-label font-medium text-ink-soft">Đáp án chấp nhận (không phân biệt hoa thường)</legend>
      {list.map((answer, index) => (
        <div key={index} className="flex items-center gap-2.5">
          <input
            value={answer}
            lang="en"
            disabled={locked}
            onChange={(event) => onChange(replaceAt(list, index, event.target.value))}
            aria-label={`Đáp án chấp nhận ${index + 1}`}
            aria-invalid={error && index === 0 ? true : undefined}
            className={cx(SMALL_INPUT, tone(error && index === 0))}
          />
          <button
            type="button"
            disabled={locked || list.length <= 1}
            onClick={() => onChange(removeAt(list, index))}
            aria-label={`Bỏ đáp án ${index + 1}`}
            className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-md text-lg text-ink-soft hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      {!locked && (
        <button
          type="button"
          onClick={() => onChange([...list, ''])}
          className="self-start cursor-pointer rounded-md px-2 py-1.5 text-label font-bold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
        >
          + Thêm đáp án
        </button>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}

/**
 * One question of an editor: collapsed it shows a one-line summary and "Sửa"; open it shows its fields with the
 * move and delete buttons.
 *
 * @param {object} props
 * @param {number} props.index
 * @param {number} props.count
 * @param {string} props.meta "Trắc nghiệm · 1 điểm"
 * @param {import('react').ReactNode} props.preview collapsed content (prompt and answer)
 * @param {boolean} props.open
 * @param {boolean} props.invalid
 * @param {() => void} props.onToggle
 * @param {(direction: -1 | 1) => void} props.onMove
 * @param {() => void} [props.onRemove] absent when questions cannot be removed
 * @param {boolean} [props.reorderLocked]
 */
export function QuestionFrame({ index, count, meta, preview, open, invalid, onToggle, onMove, onRemove, reorderLocked = false, children }) {
  const number = index + 1
  if (!open) {
    return (
      <article
        className={cx(
          'flex items-center gap-4 rounded-xl border bg-white px-5 py-4',
          invalid ? 'border-danger-solid bg-danger-bg/40' : 'border-line',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-label font-semibold text-muted-strong">
            Câu {number} · {meta}
          </h3>
          {preview}
          {invalid && <p className="text-xs font-semibold text-danger">Câu này còn lỗi, bấm “Sửa” để xem.</p>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Sửa câu ${number}`}
          className="flex-none cursor-pointer rounded-md px-3 py-1.5 text-label font-bold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
        >
          Sửa
        </button>
      </article>
    )
  }
  return (
    <article className={cx('flex flex-col gap-4 rounded-xl border-2 bg-white px-5.5 py-5', invalid ? 'border-danger-solid' : 'border-brand-tint-line')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-base font-bold text-ink">Câu {number}</h3>
        <span className="text-label text-muted-strong">{meta}</span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label={`Chuyển câu ${number} lên`} disabled={reorderLocked || index === 0} onClick={() => onMove(-1)}>
            ↑
          </IconButton>
          <IconButton label={`Chuyển câu ${number} xuống`} disabled={reorderLocked || index === count - 1} onClick={() => onMove(1)}>
            ↓
          </IconButton>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="cursor-pointer rounded-md px-2.5 py-1.5 text-label font-bold text-danger hover:bg-danger-bg focus-visible:outline-2 focus-visible:outline-brand"
            >
              Xóa câu
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="cursor-pointer rounded-md px-2.5 py-1.5 text-label font-semibold text-ink-soft hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
          >
            Thu gọn
          </button>
        </div>
      </div>
      {children}
    </article>
  )
}

function IconButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-line bg-white text-sm text-ink-soft hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function QuestionPreview({ text, answer, lang = 'en' }) {
  return (
    <>
      <p lang={lang} className="truncate text-sm text-ink">
        {text || <span className="text-muted-strong italic">Chưa có đề bài</span>}
      </p>
      {answer && (
        <p className="text-xs text-ink-soft">
          {answer[0]}: <strong lang="en">{answer[1]}</strong>
        </p>
      )}
    </>
  )
}
