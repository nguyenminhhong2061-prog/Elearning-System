import { getInitials } from '@/lib/personName'
import { cx } from '@/lib/cx'

const SIZES = {
  // Sidebar user block.
  sm: 'size-9 text-label',
  // Greeting on the home page (44px in the design).
  lg: 'size-11 text-body',
}

/** Round teal badge showing the person's initials. Decorative: the name is always shown next to it. */
export function Avatar({ name, size = 'sm', className }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex flex-none items-center justify-center rounded-full bg-brand font-bold text-white',
        SIZES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  )
}
