import { cx } from '@/lib/cx'
import { Spinner } from './Spinner'

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  // Grey button ("Thêm" in the design). Use it on white surfaces only: on the page background it disappears.
  secondary: 'bg-canvas text-ink hover:bg-line',
  // White button with a border ("Hủy" in the design). Works on any background.
  outline: 'border border-line bg-white text-ink-soft hover:bg-surface-alt',
}

const SIZES = {
  // Login button in the design: 14px padding, 15px semibold.
  md: 'px-4 py-3.5 text-body',
  // "Thêm" button in the design: 12px 18px, 13px semibold.
  sm: 'px-4.5 py-3 text-label',
}

/**
 * While `loading` is true the button is disabled (so a form cannot be submitted twice) and shows a spinner
 * in front of its label.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner label={null} className="size-4 border-white/40 border-t-white" />}
      {children}
    </button>
  )
}
