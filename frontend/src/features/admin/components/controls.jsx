import { useId } from 'react'
import { Tag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { levelLabel } from '../format'

/**
 * The design's pill group ("7 ngày / 30 ngày / 90 ngày"): toggle buttons of which exactly one is pressed.
 *
 * @param {object} props
 * @param {string} props.label accessible name of the group
 * @param {{ value: string, label: import('react').ReactNode, disabled?: boolean }[]} props.options
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {'md' | 'sm'} [props.size]
 */
export function Segmented({ label, options, value, onChange, size = 'md', className }) {
  return (
    <div role="group" aria-label={label} className={cx('flex flex-wrap gap-1 rounded-[10px] border border-line bg-white p-1', className)}>
      {options.map((option) => {
        const pressed = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cx(
              'cursor-pointer rounded-[7px] text-label whitespace-nowrap transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50',
              size === 'md' ? 'px-3.5 py-2' : 'px-3 py-1.75',
              pressed ? 'bg-brand-tint font-bold text-brand-dark' : 'font-semibold text-ink-soft hover:bg-surface-alt',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** A native select with its label written before it ("Trình độ [Tất cả ▾]"), as in the admin toolbars. */
export function InlineSelect({ label, value, onChange, options, className, hideLabel = false, ...props }) {
  const id = useId()
  return (
    <div className={cx('flex items-center gap-2 text-label font-medium text-ink-soft', className)}>
      <label htmlFor={id} className={cx(hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 cursor-pointer rounded-lg border border-line bg-white px-3 py-2.25 text-label text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function LevelTag({ level }) {
  return <Tag variant={level ? 'brand' : 'neutral'}>{levelLabel(level)}</Tag>
}

/**
 * "Hiển thị 1–10 trong 22 từ" and the page buttons.
 *
 * @param {object} props
 * @param {{ page: number, size: number, totalItems: number, totalPages: number }} props.data
 * @param {string} props.unit what the rows are ("từ", "người học")
 * @param {(page: number) => void} props.onPageChange
 */
export function Pagination({ data, unit, onPageChange }) {
  const { page, size, totalItems, totalPages } = data
  if (totalItems === 0) return null
  const first = page * size + 1
  const last = Math.min(totalItems, first + size - 1)
  const pages = pageNumbers(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-canvas px-5 py-3 text-label text-muted-strong">
      <span>
        Hiển thị {first}–{last} trong {totalItems} {unit}
      </span>
      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <PageButton label="Trang trước" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            ‹
          </PageButton>
          {pages.map((number, index) =>
            number === null ? (
              <span key={`gap-${index}`} aria-hidden="true" className="px-1">
                …
              </span>
            ) : (
              <PageButton key={number} label={`Trang ${number + 1}`} current={number === page} onClick={() => onPageChange(number)}>
                {number + 1}
              </PageButton>
            ),
          )}
          <PageButton label="Trang sau" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
            ›
          </PageButton>
        </nav>
      )}
    </div>
  )
}

/** Page indexes to show: the first, the last and two around the current one, with null for a gap. */
function pageNumbers(page, totalPages) {
  const wanted = new Set([0, totalPages - 1, page - 1, page, page + 1].filter((number) => number >= 0 && number < totalPages))
  const sorted = [...wanted].sort((a, b) => a - b)
  return sorted.flatMap((number, index) => (index > 0 && number - sorted[index - 1] > 1 ? [null, number] : [number]))
}

function PageButton({ label, current = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-label font-semibold',
        'focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40',
        current ? 'bg-brand-dark text-white' : 'text-ink-soft hover:bg-canvas',
      )}
    >
      {children}
    </button>
  )
}

// Table cells of the admin lists (design: 12px grey headings on #F7F9F8, 13px rows with a light rule).
export const TABLE = 'w-full border-collapse text-label'
export const TH = 'border-b border-line px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-ink-soft first:pl-5 last:pr-5'
export const TD = 'border-b border-canvas px-4 py-2.5 align-middle first:pl-5 last:pr-5'

/** White card holding a table; the table scrolls sideways on narrow screens instead of the page. */
export function TableCard({ label, children, footer }) {
  return (
    <section aria-label={label} className="overflow-hidden rounded-xl border border-line bg-white">
      {/* relative: the visually hidden headers (position: absolute) stay inside the scrolling box instead of widening the page. */}
      <div className="relative overflow-x-auto">{children}</div>
      {footer}
    </section>
  )
}

/** Plain link-style button of table rows ("Sửa", "Xóa"). */
export function RowAction({ tone = 'brand', className, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'cursor-pointer rounded-md px-2.5 py-1.5 text-label font-bold whitespace-nowrap hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand',
        tone === 'danger' ? 'text-danger' : 'text-brand-dark',
        className,
      )}
      {...props}
    />
  )
}
