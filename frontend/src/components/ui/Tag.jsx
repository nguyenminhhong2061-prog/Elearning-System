import { cx } from '@/lib/cx'

const VARIANTS = {
  brand: 'bg-brand-tint text-brand-dark',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-canvas text-ink-soft',
}

/** Small pill label, as used by the design for levels and difficulty ("Dễ", "Khó"). */
export function Tag({ variant = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cx('inline-flex flex-none items-center rounded-full px-2.5 py-1 text-tag font-semibold', VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
