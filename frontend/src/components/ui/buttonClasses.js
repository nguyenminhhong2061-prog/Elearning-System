import { cx } from '@/lib/cx'

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  // Main action of the admin area: white on the darker teal passes 5:1 (the learner teal only reaches 3:1).
  strong: 'bg-brand-dark text-white hover:bg-brand-ink',
  // Grey button ("Thêm" in the design). Use it on white surfaces only: on the page background it disappears.
  secondary: 'bg-canvas text-ink hover:bg-line',
  // White button with a border ("Hủy" in the design). Works on any background.
  outline: 'border border-line bg-white text-ink-soft hover:bg-surface-alt',
  // Destructive confirmation ("Xóa danh sách"). Same red as the "Chưa nhớ" button, which passes 4.5:1 with white.
  danger: 'bg-review-forgot text-white hover:bg-danger',
  // Secondary action in the brand colour ("Lưu và thêm tiếp").
  outlineBrand: 'border border-brand-tint-line bg-white text-brand-dark hover:bg-brand-tint',
  // Destructive action that opens a confirmation first ("Khóa tài khoản" on a profile).
  dangerOutline: 'border border-danger-solid/40 bg-white text-danger hover:bg-danger-bg',
}

const SIZES = {
  // Login button in the design: 14px padding, 15px semibold.
  md: 'px-4 py-3.5 text-body',
  // "Thêm" button in the design: 12px 18px, 13px semibold.
  sm: 'px-4.5 py-3 text-label',
  // Toolbar and table actions of the admin area (9px 14px).
  xs: 'px-3.5 py-2.25 text-label',
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
