/**
 * Standard wrapper for a page inside the app layout: sets the browser tab title, shows the page heading, and
 * applies the design's content width and entrance animation. Use it for every page of every module.
 *
 * @param {object} props
 * @param {string} props.title page name, shown in the tab as "<title> · LinguaStep" and as the heading
 * @param {import('react').ReactNode} [props.heading] custom heading block replacing the default <h1>
 *   (it must still contain an <h1>)
 */
export function Page({ title, heading, children }) {
  return (
    <div className="flex max-w-230 animate-screen-in flex-col gap-5">
      <title>{`${title} · LinguaStep`}</title>
      {heading ?? <h1 className="text-title font-bold text-ink">{title}</h1>}
      {children}
    </div>
  )
}
