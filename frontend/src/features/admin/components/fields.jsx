import { useId, useRef, useState } from 'react'
import { CEFR_LEVELS } from '@/api/constants'
import { describeApiError } from '@/api/errorMessages'
import { Spinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'
import { useUploadMedia } from '../api/vocabularyQueries'

// Form fields of the admin editors, in the style of TextField (label above, 15px text, red border and message when
// invalid). They work with react-hook-form: spread register('name') onto them.

const INPUT =
  'w-full rounded-lg border bg-white px-3.5 py-2.75 text-body text-ink outline-none transition-colors placeholder:text-muted-light focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted'
const inputTone = (error, warning) =>
  error
    ? 'border-danger-solid focus:border-danger-solid focus:ring-danger-solid/20'
    : warning
      ? 'border-warning-solid focus:border-brand focus:ring-brand/25'
      : 'border-line focus:border-brand focus:ring-brand/25'

function FieldFrame({ id, label, error, hint, warning, className, children }) {
  const message = error ?? warning ?? hint
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-label font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {message && (
        <p id={`${id}-message`} className={cx('text-xs leading-4', error ? 'text-danger' : warning ? 'text-warning' : 'text-muted-strong')}>
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {import('react').ReactNode} [props.error]
 * @param {string} [props.hint]
 * @param {string} [props.warning] orange note for something missing but not required ("Đang thiếu: …")
 */
export function InputField({ label, error, hint, warning, className, ref, id, ...props }) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <FieldFrame id={inputId} label={label} error={error} hint={hint} warning={warning} className={className}>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint || warning ? `${inputId}-message` : undefined}
        className={cx(INPUT, inputTone(error, warning))}
        {...props}
      />
    </FieldFrame>
  )
}

export function TextAreaField({ label, error, hint, warning, className, ref, rows = 2, ...props }) {
  const id = useId()
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} warning={warning} className={className}>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint || warning ? `${id}-message` : undefined}
        className={cx(INPUT, 'resize-y leading-5', inputTone(error, warning))}
        {...props}
      />
    </FieldFrame>
  )
}

/** @param {{ label: string, options: { value: string, label: string }[], error?: string, hint?: string }} props */
export function SelectField({ label, options, error, hint, className, ref, ...props }) {
  const id = useId()
  return (
    <FieldFrame id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={cx(INPUT, 'cursor-pointer', inputTone(error))}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  )
}

/**
 * The design's pill radios for a level ("Trình độ *  A1 A2 B1 …"). Real radio inputs, so arrows move the choice.
 * @param {{ legend: string, name: string, value: string, onChange: (level: string) => void, error?: string }} props
 */
export function LevelRadios({ legend, name, value, onChange, error, levels = CEFR_LEVELS }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-label font-medium text-ink-soft">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const checked = level === value
          return (
            <label
              key={level}
              className={cx(
                'flex h-10 min-w-13 cursor-pointer items-center justify-center rounded-lg px-3 text-label has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand',
                checked ? 'border-2 border-brand-dark bg-brand-tint font-bold text-brand-dark' : 'border border-line font-semibold text-ink-soft hover:bg-surface-alt',
              )}
            >
              <input type="radio" name={name} value={level} checked={checked} onChange={() => onChange(level)} className="sr-only" />
              {level}
            </label>
          )
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}

const MEDIA = {
  AUDIO: { accept: 'audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav', button: 'Chọn file', types: /^audio\/(mpeg|mp3|wav|x-wav)$/, typeLabel: '.mp3 hoặc .wav' },
  IMAGE: { accept: 'image/png,image/jpeg,image/webp', button: 'Chọn ảnh', types: /^image\/(png|jpeg|webp)$/, typeLabel: '.jpg, .png hoặc .webp' },
}

const megabytes = (bytes) => `${Math.round(bytes / (1024 * 1024))} MB`

/**
 * A dashed box to upload an audio file or an image (POST /api/admin/media), showing the current one with a way to
 * remove it. The value is the file's address; for audio a pasted address works too.
 *
 * @param {object} props
 * @param {'AUDIO' | 'IMAGE'} props.kind
 * @param {string} props.label
 * @param {string} props.value current address ('' when none)
 * @param {(url: string) => void} props.onChange
 * @param {number} props.maxBytes checked before uploading
 * @param {string} props.emptyTitle ("Chưa có âm thanh", "Không bắt buộc")
 * @param {string} props.emptyNote explanation next to the type and size limit
 * @param {boolean} [props.allowUrl] show "Hoặc dán đường dẫn"
 * @param {string} [props.urlError]
 * @param {string} [props.error] the file is required and missing
 * @param {boolean} [props.disabled] the file can only be listened to (a test with submissions)
 */
export function MediaPicker({ kind, label, value, onChange, maxBytes, emptyTitle, emptyNote, allowUrl = false, urlError, urlProps, error, disabled = false }) {
  const media = MEDIA[kind]
  const inputRef = useRef(null)
  const upload = useUploadMedia()
  const [problem, setProblem] = useState(null)
  const labelId = useId()

  function pick(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // picking the same file again still fires change
    if (!file) return
    setProblem(null)
    if (!media.types.test(file.type)) return setProblem(`Chỉ nhận file ${media.typeLabel}.`)
    if (file.size > maxBytes) return setProblem(`File lớn hơn ${megabytes(maxBytes)}.`)
    upload.mutate(
      { file, kind },
      {
        onSuccess: ({ url }) => onChange(url),
        onError: (error) => setProblem(describeApiError(error, 'Chưa tải được file lên. Vui lòng thử lại.')),
      },
    )
  }

  const hasFile = Boolean(value)
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <span id={labelId} className="text-label font-medium text-ink-soft">
        {label}
      </span>
      <div
        className={cx(
          'flex flex-wrap items-center gap-3.5 rounded-[10px] border-[1.5px] border-dashed bg-surface-alt px-4 py-3.5',
          error ? 'border-danger-solid' : kind === 'AUDIO' ? 'border-brand-tint-line' : 'border-line',
        )}
      >
        {kind === 'IMAGE' ? (
          hasFile ? (
            <img src={value} alt="" className="size-11 flex-none rounded-lg object-cover" />
          ) : (
            <span aria-hidden="true" className="size-11 flex-none rounded-lg bg-[repeating-linear-gradient(135deg,var(--color-brand-tint)_0_8px,var(--color-brand-stripe)_8px_16px)]" />
          )
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none text-brand-dark">
            <path d="M4 9v4h3l5 4V5L7 9z" />
            <path d="M15.5 8.5a4 4 0 010 5M17.8 6.2a7.3 7.3 0 010 9.6" />
          </svg>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {hasFile ? (
            <>
              <span className="text-label font-semibold text-ink">{kind === 'AUDIO' ? 'Đã có âm thanh' : 'Đã có ảnh'}</span>
              {kind === 'AUDIO' && <audio controls src={value} className="mt-1 h-8 w-full max-w-72" />}
              <span className="truncate text-xs text-muted-strong">{value}</span>
            </>
          ) : (
            <>
              <span className="text-label font-semibold text-ink">{emptyTitle}</span>
              <span className="text-xs text-muted-strong">
                {media.typeLabel}, tối đa {megabytes(maxBytes)}. {emptyNote}
              </span>
            </>
          )}
        </div>
        <div className={cx('flex flex-none items-center gap-2', disabled && 'hidden')}>
          {hasFile && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-label font-semibold text-danger hover:bg-danger-bg focus-visible:outline-2 focus-visible:outline-brand"
            >
              Gỡ
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-label font-semibold text-ink-soft hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70"
          >
            {upload.isPending && <Spinner label={null} className="size-4" />}
            {upload.isPending ? 'Đang tải lên…' : hasFile ? 'Thay file' : media.button}
          </button>
          <input ref={inputRef} type="file" accept={media.accept} onChange={pick} className="hidden" aria-label={`${media.button} (${label})`} />
        </div>
      </div>
      {(problem || error) && (
        <p role={problem ? 'alert' : undefined} className="text-xs text-danger">
          {problem ?? error}
        </p>
      )}
      {allowUrl && !disabled && (
        <InputField
          label={kind === 'AUDIO' ? 'Hoặc dán đường dẫn audio' : 'Hoặc dán đường dẫn ảnh'}
          type="url"
          placeholder="https://…"
          error={urlError}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="[&_input]:py-2.25 [&_input]:text-sm [&_label]:text-xs [&_label]:text-muted-strong"
          {...urlProps}
        />
      )}
    </div>
  )
}
