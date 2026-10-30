import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Bottom sheet on phones, centered panel on wider screens. Built on the native
 * <dialog> element, which handles focus trapping and the Escape key.
 */
export function Sheet({ open, title, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
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
