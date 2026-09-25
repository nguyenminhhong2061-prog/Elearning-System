import { useEffect, useId, useRef } from 'react'
import { cx } from '@/lib/cx'

/**
 * Modal dialog in the design's style ("Tạo danh sách riêng"), built on the native <dialog> element, which traps
 * focus, closes on Escape and restores focus to the opener by itself. Its content is only rendered while open, so a
 * form inside starts empty each time.
 *
 * Browsers without showModal (and jsdom in tests) fall back to the plain `open` attribute.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose asked to close (Escape, a click on the backdrop); the parent sets open to false
 * @param {string} props.title
 */
export function Dialog({ open, onClose, title, className, children }) {
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
        event.preventDefault() // the parent owns `open`
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose() // a click on the backdrop, outside the panel
      }}
      className={cx(
        'm-auto w-[calc(100%-2rem)] max-w-119 rounded-[14px] bg-white p-0 text-ink backdrop:bg-ink/45 open:animate-screen-in',
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-4 p-7">
          <h2 id={titleId} className="text-xl font-bold text-ink">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  )
}
