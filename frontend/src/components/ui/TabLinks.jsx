import { Link } from 'react-router'
import { cx } from '@/lib/cx'

/**
 * Underlined tabs of the design ("Chủ đề có sẵn" / "Danh sách của tôi"). Each tab is a link, so the selected tab is
 * part of the URL and survives reloads and the back button.
 *
 * @param {object} props
 * @param {string} props.label accessible name of the tab bar
 * @param {Array<{ id: string, label: import('react').ReactNode, to: string }>} props.tabs
 * @param {string} props.current id of the selected tab
 */
export function TabLinks({ label, tabs, current }) {
  return (
    <nav aria-label={label} className="flex gap-5 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const selected = tab.id === current
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={selected ? 'page' : undefined}
            className={cx(
              '-mb-px flex-none border-b-2 pb-2.5 text-sm font-semibold whitespace-nowrap',
              selected ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink-soft',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
