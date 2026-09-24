import { cx } from '@/lib/cx'

/** White panel with the design's 1px border and 12px corners. */
export function Card({ className, children, ...props }) {
  return (
    <div className={cx('rounded-xl border border-line bg-white p-6', className)} {...props}>
      {children}
    </div>
  )
}
