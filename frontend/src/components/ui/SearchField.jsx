import { useId, useRef } from 'react'
import { cx } from '@/lib/cx'

/**
 * Compact search box from the design (magnifier ring + 13px text). The label is visually hidden but still read
 * by screen readers; pass it even though the placeholder says the same thing. With `onClear`, a clear button
 * appears while there is text (the browser's own one is hidden because its colour does not match the design).
 */
export function SearchField({ label, className, value, onClear, ...inputProps }) {
  const id = useId()
  const inputRef = useRef(null)

  function clear() {
    onClear()
    inputRef.current?.focus()
  }

  return (
    <div
      className={cx(
        'flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.75 transition-colors',
        'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25',
        className,
      )}
    >
      <span aria-hidden="true" className="inline-block size-3.75 flex-none rounded-full border-2 border-muted-light" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="search"
        autoComplete="off"
        value={value}
        className="min-w-0 flex-1 bg-transparent text-label text-ink outline-none placeholder:text-muted-light [&::-webkit-search-cancel-button]:appearance-none"
        {...inputProps}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Xóa tìm kiếm"
          className="flex-none cursor-pointer rounded px-1 text-label leading-none text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          ✕
        </button>
      )}
    </div>
  )
}
