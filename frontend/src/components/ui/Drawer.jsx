import { useEffect, useId, useRef } from 'react'
import { cx } from '@/lib/cx'

/**
 * Panel sliding in from the right edge ("Sửa từ" in the admin design), built on the native <dialog> element like
 * Dialog: it traps focus, Escape asks to close, focus returns to the opener. The content is only rendered while open.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose asked to close (✕, Escape, a click on the backdrop); the parent decides
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.subtitle]
 * @param {import('react').ReactNode} [props.footer] actions pinned to the bottom
 */
export function Drawer({ open, onClose, title, subtitle, footer, children }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    const isOpen = dialog.hasAttribute('open')
    if (open && !isOpen) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && isOpen) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={cx(
        'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-140 bg-white p-0 text-ink shadow-2xl',
        'backdrop:bg-ink/35 open:flex open:flex-col open:animate-drawer-in',
      )}
    >
      {open && (
        <>
          <header className="flex items-start gap-4 border-b border-line px-7 pt-6 pb-5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 id={titleId} className="text-xl font-bold text-ink">
                {title}
              </h2>
              {subtitle && <p className="text-label text-muted-strong">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="-mt-1 -mr-2 flex size-9 flex-none cursor-pointer items-center justify-center rounded-lg text-lg text-ink-soft hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
            >
              ✕
            </button>
          </header>
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-7 py-6">{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-7 py-4">{footer}</footer>}
        </>
      )}
    </dialog>
  )
}
