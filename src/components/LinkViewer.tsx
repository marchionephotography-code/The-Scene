import { ArrowLeft, ExternalLink, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { OutsideLink } from '../lib/links'

interface Props {
  link: OutsideLink
  onBack: () => void
}

/** Sites that refuse to show inside another app; we go straight to the card for these. */
const NO_EMBED = /(^|\.)(ticketmaster|livenation|seatgeek|venmo|cash\.app|x\.com|twitter|threads\.net|bsky\.app|whatsapp|wa\.me|instagram|facebook|tiktok|calendar\.google|accounts\.google|maps\.apple|google\.[a-z.]+$)/i

function host(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}

const embeddedApp = (() => {
  try { return window.top !== window.self } catch { return true }
})()

/**
 * An outside page inside The Scene, with a Back button. Many sites (ticketing,
 * social, Google) don't allow being shown inside another app, so those get a
 * clear card with a button to open them in the browser instead of a blank.
 */
export function LinkViewer({ link, onBack }: Props) {
  const src = link.embed ?? link.href
  const site = host(link.href)
  const canFrame = !embeddedApp && (Boolean(link.embed) || !NO_EMBED.test(host(src)))
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  const backRef = useRef<HTMLButtonElement>(null)
  const dlg = useRef<HTMLDialogElement>(null)

  // A modal <dialog> sits in the top layer, above an open event sheet.
  useEffect(() => {
    const d = dlg.current
    if (d && !d.open) d.showModal()
    return () => { if (d?.open) d.close() }
  }, [])

  useEffect(() => {
    backRef.current?.focus()
    const t = window.setTimeout(() => setSlow(true), 4000)
    return () => window.clearTimeout(t)
  }, [onBack])

  const open = () => window.open(link.href, '_blank', 'noopener')

  return (
    <dialog
      ref={dlg}
      className="viewer"
      aria-label={`${link.label || site}, from ${site}`}
      onCancel={(e) => { e.preventDefault(); onBack() }}
    >
      <header className="viewer__bar">
        <button ref={backRef} type="button" className="viewer__back" onClick={onBack}>
          <ArrowLeft size={20} strokeWidth={2.5} aria-hidden="true" /> Back
        </button>
        <span className="viewer__site"><Globe size={14} strokeWidth={2.25} aria-hidden="true" /> {site}</span>
        <button type="button" className="round-btn viewer__open" aria-label={`Open ${site} in your browser`} onClick={open}>
          <ExternalLink size={18} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </header>

      {canFrame ? (
        <div className="viewer__body">
          {!loaded && <div className="viewer__loading" aria-hidden="true" />}
          <iframe
            className="viewer__frame"
            src={src}
            title={link.label || site}
            onLoad={() => setLoaded(true)}
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            allow="geolocation"
          />
          {slow && !link.embed && (
            <p className="viewer__hint">
              Page blank? Some sites don’t open inside apps.{' '}
              <button type="button" className="link-btn" onClick={open}>Open it in your browser</button>
            </p>
          )}
        </div>
      ) : (
        <div className="viewer__card">
          <span className="viewer__icon" aria-hidden="true"><Globe size={28} strokeWidth={2} /></span>
          <h2 className="viewer__title">{link.label || site}</h2>
          <p className="viewer__text">
            {embeddedApp
              ? 'This page opens in a new tab while you’re in the preview. On the live app it opens right here.'
              : `${site} doesn’t allow its pages inside other apps, so it opens in your browser. Come back here when you’re done.`}
          </p>
          <button type="button" className="btn btn--lg" onClick={open}>
            Open {site} <ExternalLink size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <button type="button" className="link-btn" onClick={onBack}>Back to The Scene</button>
        </div>
      )}
    </dialog>
  )
}
