import { cx } from '@/lib/cx'

/**
 * Small rotating ring. Pass className to change the size or colours (default: brand teal, 20px).
 * With `label={null}` it is purely decorative (hidden from assistive technology), for use inside an element
 * that already announces its busy state, such as a loading Button.
 */
export function Spinner({ className, label = 'Đang tải' }) {
  const a11y = label === null ? { 'aria-hidden': true } : { role: 'status', 'aria-label': label }

  return (
    <span
      {...a11y}
      className={cx(
        'inline-block size-5 animate-spin rounded-full border-2 border-brand-tint-line border-t-brand',
        className,
      )}
    />
  )
}
