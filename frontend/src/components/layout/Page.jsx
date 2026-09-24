import { cx } from '@/lib/cx'

const WIDTHS = {
  // Most screens of the design (dashboard, topics...): 920px.
  wide: 'max-w-230',
  // Single-column screens of the design (topic detail, flashcards): 520px.
  narrow: 'max-w-130',
}

/**
 * Standard wrapper for a page inside the app layout: sets the browser tab title, shows the page heading, and
 * applies the design's content width and entrance animation. Use it for every page of every module.
 *
 * @param {object} props
 * @param {string} props.title page name, shown in the tab as "<title> · LinguaStep" and as the heading
 * @param {import('react').ReactNode} [props.heading] custom heading block replacing the default <h1>
 *   (it must still contain an <h1>)
 * @param {'wide' | 'narrow'} [props.width]
 */
export function Page({ title, heading, width = 'wide', children }) {
  return (
    <div className={cx('flex animate-screen-in flex-col gap-5', WIDTHS[width])}>
      <title>{`${title} · LinguaStep`}</title>
      {heading ?? <h1 className="text-title font-bold text-ink">{title}</h1>}
      {children}
    </div>
  )
}
