import { useId } from 'react'
import { cx } from '@/lib/cx'

/**
 * Labelled text input in the design's style. It works with react-hook-form: spread `register('name')` onto it
 * (React 19 passes `ref` as an ordinary prop, so no forwardRef is needed).
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.error] validation message; also marks the input as invalid for assistive technology
 * @param {string} [props.hint] helper text shown below the input while there is no error
 * @param {import('react').ReactNode} [props.endAdornment] element placed inside the input, on the right
 */
export function TextField({ label, error, hint, endAdornment, id, className, type = 'text', ref, ...inputProps }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const hasMessage = Boolean(error || hint)

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={cx(
            'w-full rounded-lg border bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition-colors',
            'placeholder:text-muted-light',
            'focus:border-brand focus:ring-2 focus:ring-brand/25',
            'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted',
            error ? 'border-danger-solid' : 'border-line',
            endAdornment && 'pr-16',
          )}
          {...inputProps}
        />
        {endAdornment && <div className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</div>}
      </div>
      {hasMessage && (
        <p id={messageId} className={cx('text-xs', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
