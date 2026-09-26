import { cx } from '@/lib/cx'

// Class strings are written out in full so Tailwind can find them.
const ARC = {
  brand: 'bg-[conic-gradient(var(--color-brand)_var(--ring-fill),var(--ring-track)_0)]',
  good: 'bg-[conic-gradient(var(--color-success-solid)_var(--ring-fill),var(--ring-track)_0)]',
  fair: 'bg-[conic-gradient(var(--color-warning-solid)_var(--ring-fill),var(--ring-track)_0)]',
  poor: 'bg-[conic-gradient(var(--color-danger-solid)_var(--ring-fill),var(--ring-track)_0)]',
}

const SIZE = {
  // Result card of the design: 96px ring, 8px thick, 26px number.
  lg: { ring: 'size-24', hole: 'inset-2', text: 'text-[26px] leading-8' },
  // Pronunciation score of the design: 78px ring, 6px thick, 22px number.
  md: { ring: 'size-19.5', hole: 'inset-1.5', text: 'text-[22px] leading-7' },
}

/**
 * The design's round score badge ("8/10", "86"). The coloured arc covers `fraction` of the circle, so the ring also
 * shows how good the score is.
 *
 * @param {object} props
 * @param {number} props.fraction 0 to 1
 * @param {import('react').ReactNode} props.children the text in the middle
 * @param {string} props.label full wording for screen readers ("Đúng 8 trên 10 câu")
 * @param {'brand' | 'good' | 'fair' | 'poor'} [props.tone]
 * @param {'lg' | 'md'} [props.size]
 * @param {boolean} [props.dark] on the dark pronunciation card
 */
export function ScoreRing({ fraction, children, label, tone = 'brand', size = 'lg', dark = false, className }) {
  const fill = `${Math.round(Math.min(Math.max(fraction, 0), 1) * 100)}%`
  const { ring, hole, text } = SIZE[size]

  return (
    <div
      role="img"
      aria-label={label}
      style={{ '--ring-fill': fill, '--ring-track': dark ? 'var(--color-sidebar-raised)' : 'var(--color-line)' }}
      className={cx('relative flex flex-none items-center justify-center rounded-full', ring, ARC[tone], className)}
    >
      <span aria-hidden="true" className={cx('absolute rounded-full', hole, dark ? 'bg-sidebar-deep' : 'bg-white')} />
      <span aria-hidden="true" className={cx('relative font-bold tabular-nums', text, dark ? 'text-white' : 'text-ink')}>
        {children}
      </span>
    </div>
  )
}
