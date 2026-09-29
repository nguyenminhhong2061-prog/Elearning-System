import { cx } from '@/lib/cx'

const VARIANTS = {
  error: 'border-danger-solid/30 bg-danger-bg text-danger',
  success: 'border-success-line bg-success-bg text-success',
  info: 'border-brand-tint-line bg-brand-tint text-brand-dark',
  // Something to act on that is not an error (a missed weekly goal): the design's orange.
  warning: 'border-warning-solid/40 bg-warning-bg text-warning',
}

/** Status box. Errors use role="alert" (announced immediately); success, info and warning use role="status". */
export function Alert({ variant = 'info', className, children }) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cx('rounded-[10px] border px-4 py-3 text-sm font-semibold', VARIANTS[variant], className)}
    >
      {children}
    </div>
  )
}
