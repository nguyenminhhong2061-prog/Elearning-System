import { cx } from '@/lib/cx'

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

/** Class names of a button; also used by ButtonLink so links that act as buttons look the same. */
export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cx(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
