import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { prefersReducedMotion } from '../lib/motion'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Matches the exit animation length in index.css (.sheet[data-closing]). */
const EXIT_MS = 200

/**
 * Bottom sheet on phones, centered panel on wider screens. Built on the native
 * <dialog> element, which handles focus trapping. Every close path (Escape,
 * backdrop tap, close button) goes through `onClose`, so the exit animation
 * always plays before the dialog is removed.
 */
export function Sheet({ open, title, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open) {
      d.removeAttribute('data-closing')
      if (!d.open) d.showModal()
      return
    }
    if (!d.open) return
    if (prefersReducedMotion()) {
      d.close()
      return
    }
    d.setAttribute('data-closing', '')
    const t = window.setTimeout(() => {
      d.removeAttribute('data-closing')
      d.close()
    }, EXIT_MS)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Escape: run our animated close instead of the instant native one.
        e.preventDefault()
        onClose()
      }}
      onClose={onClose}
      onMouseDown={(e) => {
        // Tap on the dimmed backdrop closes the sheet.
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="sheet__inner">
        <header className="sheet__head">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.25} />
          </button>
          <h2 id={titleId} className="sheet__title">{title}</h2>
          <span className="icon-btn icon-btn--spacer" aria-hidden="true" />
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__foot">{footer}</footer>}
      </div>
    </dialog>
  )
}
