import { cx } from '@/lib/cx'

/** Small rotating ring. Pass className to change the size or colours (default: brand teal, 20px). */
export function Spinner({ className, label = 'Đang tải' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        'inline-block size-5 animate-spin rounded-full border-2 border-brand-tint-line border-t-brand',
        className,
      )}
    />
  )
}
