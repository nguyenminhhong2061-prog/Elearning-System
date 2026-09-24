import { cx } from '@/lib/cx'
import { Spinner } from './Spinner'

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'bg-canvas text-ink hover:bg-line',
}

const SIZES = {
  // Login button in the design: 14px padding, 15px semibold.
  md: 'px-4 py-3.5 text-[15px]',
  // "Thêm" button in the design: 12px 18px, 13px semibold.
  sm: 'px-[18px] py-3 text-[13px]',
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
      {loading && <Spinner label="Đang xử lý" className="size-4 border-white/40 border-t-white" />}
      {children}
    </button>
  )
}
