import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router'
import { cx } from '@/lib/cx'
import { RouteBoundary } from './RouteBoundary'

/**
 * Frame shared by the learner area (AppLayout) and the admin area (AdminLayout). From the md breakpoint up it is the
 * design's dark sidebar plus the content area; on narrow screens the sidebar becomes a top bar with a menu button,
 * because the design's fixed-ratio sidebar column would be unusably thin on a phone.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.brand logo row at the top of the sidebar and of the phone bar
 * @param {(onNavigate?: () => void) => import('react').ReactNode} props.renderSidebar everything below the logo; the
 *   phone menu passes `onNavigate` so it can close itself after a link is used
 * @param {string} [props.columnsClassName] grid columns from the md breakpoint up (sidebar width)
 */
export function AppShell({ brand, renderSidebar, columnsClassName = 'md:grid-cols-[min(236px,26vw)_minmax(0,1fr)]' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Escape closes the phone menu and puts focus back on the button that opened it.
  useEffect(() => {
    if (!menuOpen) return undefined

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <div className={cx('min-h-screen md:grid', columnsClassName)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Bỏ qua điều hướng
      </a>

      <aside className="hidden flex-col gap-6 bg-sidebar px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
        <div className="px-1.5">{brand}</div>
        {renderSidebar()}
      </aside>

      <header className="sticky top-0 z-20 bg-sidebar md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {brand}
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="cursor-pointer rounded-lg p-2 text-sidebar-text hover:bg-sidebar-raised focus-visible:outline-2 focus-visible:outline-brand"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto bg-sidebar px-4 pt-2 pb-6 shadow-lg"
          >
            {renderSidebar(closeMenu)}
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1} className="min-w-0 p-[clamp(16px,4vw,32px)] outline-none md:px-[clamp(16px,4vw,40px)]">
        <RouteBoundary>
          <Outlet />
        </RouteBoundary>
      </main>
    </div>
  )
}
