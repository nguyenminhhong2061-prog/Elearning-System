import { cx } from '@/lib/cx'

// The design draws its screens for a 1280px window (920px of content). On wider screens that left most of the window
// empty, so lists and grids now grow with the window, and single-task screens are centred.
const WIDTHS = {
  // Lists and grids (dashboard, topics, history...): as wide as the window, up to 1600px so lines stay readable.
  wide: 'max-w-400',
  // A task beside a side panel (a game next to its leaderboard).
  medium: 'max-w-320',
  // One task at a time (flashcards, a form): a single centred column, 520px as in the design.
  focus: 'max-w-130',
}

/**
 * Standard wrapper for a page inside the app layout: sets the browser tab title, shows the page heading, and
 * applies the content width (centred in the window) and the design's entrance animation. Use it for every page of
 * every module.
 *
 * @param {object} props
 * @param {string} props.title page name, shown in the tab as "<title> · LinguaStep" and as the heading
 * @param {import('react').ReactNode} [props.heading] custom heading block replacing the default <h1>
 *   (it must still contain an <h1>)
 * @param {'wide' | 'medium' | 'focus'} [props.width]
 * @param {string} [props.className] extra classes, for example a larger width on big screens
 */
export function Page({ title, heading, width = 'wide', className, children }) {
  return (
    <div className={cx('mx-auto flex animate-screen-in flex-col gap-5', WIDTHS[width], className)}>
      <title>{`${title} · LinguaStep`}</title>
      {heading ?? <h1 className="text-title font-bold text-ink">{title}</h1>}
      {children}
    </div>
  )
}
