import { Check, Copy, Heart, Mail, MessageCircle, Plus, Share2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { Saved } from '../hooks/useSaved'
import { CATEGORIES } from '../lib/discovery'
import { formatPriceRange, PRICE_STATUS_LABEL } from '../lib/money'
import { buildShareText, formatShareWhen, mailtoHref, PASTE_TARGETS, smsHref, socialTargets } from '../lib/share'
import type { SceneEvent } from '../types/event'

const AGE_TEXT = { 'all-ages': 'All ages', family: 'Family friendly', '18+': '18+', '21+': '21+' } as const

interface Props {
  event: SceneEvent
  saved: Saved
}

/** Body of the event sheet: details, save actions, and sharing. */
export function EventDetail({ event, saved }: Props) {
  const [message, setMessage] = useState(() => buildShareText(event))
  const [copied, setCopied] = useState(false)
  const [pastedFor, setPastedFor] = useState<string | null>(null)
  const messageId = useId()
  const fav = saved.isFavorite(event.id)
  const wish = saved.onWishlist(event.id)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 2200)
    return () => window.clearTimeout(t)
  }, [copied])

  useEffect(() => {
    if (!pastedFor) return
    const t = window.setTimeout(() => setPastedFor(null), 6000)
    return () => window.clearTimeout(t)
  }, [pastedFor])

  /** Copy the message, then let the link open the app (runs inside the click). */
  const copyThenOpen = (label: string) => {
    navigator.clipboard?.writeText(message).then(
      () => setPastedFor(label),
      () => setPastedFor(null),
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      // Clipboard blocked: select the text so the person can copy it by hand.
      const el = document.getElementById(messageId) as HTMLTextAreaElement | null
      el?.select()
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: event.title, text: message })
    } catch {
      // Cancelled or not allowed; nothing to do.
    }
  }

  const category = CATEGORIES.find((c) => c.id === event.category)!.label

  return (
    <div className="detail">
      <section className="detail__info">
        <p className="detail__cat">{category}{event.local ? ' · Local pick' : ''}</p>
        <h3 className="detail__title">{event.title}</h3>
        <p className="detail__line detail__line--strong">{formatShareWhen(event.start)}</p>
        <p className="detail__line">{event.venue} · {event.town}</p>
        <p className="detail__line">
          <strong>{formatPriceRange(event.price)}</strong>{' '}
          <span className={`status status--${event.price.status}`}>{PRICE_STATUS_LABEL[event.price.status]}</span>
          {' · '}{AGE_TEXT[event.age]}
        </p>
        <p className="detail__desc">{event.description}</p>
        {event.host?.kind === 'library' && (
          <p className="detail__host">
            Hosted by {event.host.name}
            {event.url && (
              <>
                {' · '}
                <a href={event.url} target="_blank" rel="noopener noreferrer">See it on the library’s calendar</a>
              </>
            )}
          </p>
        )}
      </section>

      <div className="detail__save">
        <button type="button" className={`save-btn${fav ? ' save-btn--on' : ''}`} aria-pressed={fav} onClick={() => saved.toggleFavorite(event.id)}>
          <Heart size={18} strokeWidth={2.25} fill={fav ? 'currentColor' : 'none'} aria-hidden="true" />
          {fav ? 'Favorited' : 'Favorite'}
        </button>
        <button type="button" className={`save-btn${wish ? ' save-btn--on' : ''}`} aria-pressed={wish} onClick={() => saved.toggleWishEvent(event.id, event.title)}>
          {wish ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <Plus size={18} strokeWidth={2.5} aria-hidden="true" />}
          {wish ? 'On wish list' : 'Wish list'}
        </button>
      </div>

      <section className="detail__share" aria-labelledby={`${messageId}-h`}>
        <h3 id={`${messageId}-h`} className="sheet__label">Invite friends</h3>
        <label className="field-label" htmlFor={messageId}>Message (you can edit it)</label>
        <textarea
          id={messageId}
          className="input input--area"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="share-main">
          <a className="share-btn" href={smsHref(message)}>
            <span className="share-btn__icon"><MessageCircle size={20} strokeWidth={2.25} aria-hidden="true" /></span>
            Text a friend
          </a>
          <a className="share-btn" href={mailtoHref(`Want to go? ${event.title}`, message)}>
            <span className="share-btn__icon"><Mail size={20} strokeWidth={2.25} aria-hidden="true" /></span>
            Email
          </a>
          <button type="button" className="share-btn" onClick={copy}>
            <span className="share-btn__icon">
              {copied ? <Check size={20} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={20} strokeWidth={2.25} aria-hidden="true" />}
            </span>
            {copied ? 'Copied' : 'Copy caption'}
          </button>
          {canNativeShare && (
            <button type="button" className="share-btn" onClick={nativeShare}>
              <span className="share-btn__icon"><Share2 size={20} strokeWidth={2.25} aria-hidden="true" /></span>
              More…
            </button>
          )}
        </div>

        <p className="field-label">Post to social media</p>
        <div className="share-social">
          {socialTargets(message).map((s) => (
            <a key={s.id} className={`social social--${s.id}`} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
          {PASTE_TARGETS.map((s) => (
            <a
              key={s.id}
              className={`social social--${s.id}`}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => copyThenOpen(s.label)}
            >
              {s.label}
            </a>
          ))}
        </div>
        {pastedFor ? (
          <p className="hint hint--ok" role="status">
            <Check size={14} strokeWidth={3} aria-hidden="true" /> Message copied. In {pastedFor}, paste it into your post or caption.
          </p>
        ) : (
          <p className="hint">
            X, Threads, Bluesky, and WhatsApp open with your post ready to send. Instagram, TikTok, and Facebook copy your
            message first, then open so you can paste it.
          </p>
        )}
        <p className="sr-only" role="status">{copied ? 'Message copied' : ''}</p>
      </section>
    </div>
  )
}
