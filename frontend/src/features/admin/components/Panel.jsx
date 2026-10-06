import { useId } from 'react'
import { cx } from '@/lib/cx'

/**
 * White block with a heading, as the overview and the user page draw them.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.aside] short text right of the heading ("128 người")
 * @param {boolean} [props.flush] the content (a table) reaches the edges; only the heading keeps the padding
 * @param {string} [props.className]
 */
export function Panel({ title, aside, flush = false, className, children }) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cx('flex flex-col gap-3.5 rounded-xl border border-line bg-white', flush ? 'overflow-hidden pt-5' : 'px-5.5 py-5', className)}
    >
      <div className={cx('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1', flush && 'px-5.5')}>
        <h2 id={id} className="text-base font-bold text-ink">
          {title}
        </h2>
        {aside && <span className="text-label text-muted-strong">{aside}</span>}
      </div>
      {children}
    </section>
  )
}
