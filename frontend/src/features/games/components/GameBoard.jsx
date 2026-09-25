import { cx } from '@/lib/cx'

/** A white-on-teal pill of the design's game header ("00:42", "30 điểm"). */
export function Pill({ children, label }) {
  return (
    <span aria-label={label} className="rounded-full bg-white/18 px-3.5 py-1.5 font-mono text-label font-bold text-white tabular-nums">
      {children}
    </span>
  )
}

/**
 * The design's teal game panel: title and pills on top, the game below.
 * @param {{ title: string, aside?: import('react').ReactNode, className?: string }} props
 */
export function GameBoard({ title, aside, className, children }) {
  return (
    <div
      className={cx(
        'flex flex-col gap-4.5 rounded-2xl bg-[linear-gradient(155deg,var(--color-brand-dark),var(--color-brand))] p-6.5 text-white',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[19px] leading-6 font-bold text-white">{title}</h1>
        {aside && <div className="flex flex-wrap gap-2.5">{aside}</div>}
      </div>
      {children}
    </div>
  )
}
