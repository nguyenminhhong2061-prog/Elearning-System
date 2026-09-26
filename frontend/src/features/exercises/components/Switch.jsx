import { cx } from '@/lib/cx'

/**
 * The design's small on/off toggle ("Hiện bản dịch"): a 36×20 track with a white knob. It is a button with
 * role="switch", so it is reachable with Tab and announced as on or off.
 *
 * @param {{ checked: boolean, onChange: (checked: boolean) => void, label: string }} props
 */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center gap-2.5 rounded-full text-xs text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span>{label}</span>
      <span aria-hidden="true" className={cx('flex h-5 w-9 items-center rounded-full p-0.5 transition-colors', checked ? 'bg-brand' : 'bg-line')}>
        <span className={cx('size-4 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-4')} />
      </span>
    </button>
  )
}
