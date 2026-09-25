import { cx } from '@/lib/cx'

/** Grey placeholder block shown while content loads. Size it with className (e.g. "h-4 w-32"). */
export function Skeleton({ className }) {
  return <span aria-hidden="true" className={cx('block animate-pulse rounded-md bg-canvas', className)} />
}
