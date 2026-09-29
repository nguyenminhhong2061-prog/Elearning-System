import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext'

const VISIBLE_MS = 3500

/**
 * Short confirmation shown at the bottom of the screen after an action ("Đã lưu"), then gone by itself. It is a
 * live region, so screen readers announce it without moving focus. Wrap a layout in <ToastProvider> and call
 * `useToast()(message, detail)` (toastContext.js) from any page inside it.
 *
 * The region is a manual popover, so it sits in the browser's top layer: a confirmation shown while a side panel or
 * a dialog is open ("Lưu và thêm tiếp") appears above it instead of behind its backdrop.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const region = useRef(null)

  const show = useCallback((message, detail = null) => {
    clearTimeout(timer.current)
    setToast({ message, detail, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  // The live region must exist before its first message to be announced, so the popover opens (empty) right away.
  // Showing it again with each message puts it above any dialog opened since. jsdom has no popovers: there the
  // region simply stays in the page.
  useEffect(() => {
    const element = region.current
    if (typeof element?.showPopover === 'function' && !element.matches(':popover-open')) element.showPopover()
  }, [])

  useEffect(() => {
    const element = region.current
    if (!toast || typeof element?.showPopover !== 'function') return
    if (element.matches(':popover-open')) element.hidePopover()
    element.showPopover()
  }, [toast])

  const value = useMemo(() => show, [show])

  return (
    <ToastContext value={value}>
      {children}
      <div
        ref={region}
        popover="manual"
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-auto bottom-6 m-0 flex w-auto justify-center overflow-visible border-0 bg-transparent px-4 py-0"
      >
        {toast && (
          <div
            key={toast.key}
            className="flex max-w-120 animate-screen-in items-start gap-3 rounded-xl bg-ink px-4.5 py-3.5 text-white shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px flex-none text-brand-tint-line">
              <path d="M4 9.5l3.2 3.2L14 5.8" />
            </svg>
            <p className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">{toast.message}</span>
              {toast.detail && <span className="text-label text-sidebar-text">{toast.detail}</span>}
            </p>
          </div>
        )}
      </div>
    </ToastContext>
  )
}
