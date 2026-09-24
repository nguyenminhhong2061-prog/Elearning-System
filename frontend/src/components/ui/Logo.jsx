import { cx } from '@/lib/cx'

const VARIANTS = {
  // Login card and other pages on a light background.
  light: { mark: 'size-7 rounded-lg', text: 'text-lg text-brand-dark' },
  // Dark sidebar.
  dark: { mark: 'size-6.5 rounded-[7px]', text: 'text-base text-white' },
}

export function Logo({ variant = 'light', className }) {
  const styles = VARIANTS[variant]

  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <span aria-hidden="true" className={cx('inline-block bg-brand', styles.mark)} />
      <span className={cx('font-bold', styles.text)}>LinguaStep</span>
    </div>
  )
}
