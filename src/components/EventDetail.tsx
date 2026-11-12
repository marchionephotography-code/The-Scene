import { Check, Copy, Mail, MessageCircle, Plus, Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Saved } from '../hooks/useSaved'
import { CATEGORIES } from '../lib/discovery'
import { formatPriceRange, PRICE_STATUS_LABEL } from '../lib/money'
import { appHref, buildShareText, detectPlatform, formatShareWhen, mailtoHref, PASTE_TARGETS, socialTargets } from '../lib/share'
import type { SceneEvent } from '../types/event'
import { GroupText } from './GroupText'
import { PlanTools } from './PlanTools'
import { ReportProblem } from './ReportProblem'

const AGE_TEXT = { 'all-ages': 'All ages', family: 'Family friendly', '18+': '18+', '21+': '21+' } as const

interface Props {
  event: SceneEvent
  saved: Saved
  allEvents: SceneEvent[]
  onOpenEvent: (id: string) => void
  moreLike: boolean
  onMoreLike: () => void
  onNotForMe: () => void
}

/** Body of the event sheet: details, save actions, and sharing. */
export function EventDetail({ event, saved, allEvents, onOpenEvent, moreLike, onMoreLike, onNotForMe }: Props) {
  const [message, setMessage] = useState(() => buildShareText(event))
  const [copied, setCopied] = useState(false)
  const [pastedFor, setPastedFor] = useState<string | null>(null)
  const [textOpen, setTextOpen] = useState(false)
  /** Set when an app link didn't open (app not installed), to offer the website. */
  const [fallback, setFallback] = useState<{ label: string; href: string } | null>(null)
  const [platform] = useState(() => detectPlatform())
  const messageId = 'invite-message'
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
  const copyThenOpen = (t: (typeof PASTE_TARGETS)[number]) => {
    setFallback(null)
    navigator.clipboard?.writeText(message).then(
      () => setPastedFor(t.label),
      () => setPastedFor(null),
    )
    if (platform !== 'ios') return
    // If the page is still showing after a moment, the app isn't installed.
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') setFallback({ label: t.label, href: t.href })
    }, 1500)
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
        {event.status === 'postponed' && (
          <p className="detail__status" role="note"><strong>Postponed.</strong> The organizer hasn’t set a new date yet. Check their page before you go.</p>
        )}
        {event.status === 'rescheduled' && (
          <p className="detail__status" role="note"><strong>Rescheduled.</strong> This is the new date. Tickets for the old date usually still work.</p>
        )}
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

      <div className="detail__taste" role="group" aria-label="Tune your picks">
        <button type="button" className={`taste-btn${moreLike ? ' taste-btn--on' : ''}`} aria-pressed={moreLike} onClick={onMoreLike}>
          <ThumbsUp size={17} strokeWidth={2.25} aria-hidden="true" /> More like this
        </button>
        <button type="button" className="taste-btn" onClick={onNotForMe}>
          <ThumbsDown size={17} strokeWidth={2.25} aria-hidden="true" /> Not for me
        </button>
      </div>

      <div className="detail__save">
        <button type="button" className={`save-btn${wish ? ' save-btn--on' : ''}`} aria-pressed={wish} onClick={() => saved.toggleWishEvent(event.id, event.title)}>
          {wish ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <Plus size={18} strokeWidth={2.5} aria-hidden="true" />}
          {wish ? 'On your wish list' : 'Add to wish list'}
        </button>
      </div>

      <PlanTools
        event={event}
        allEvents={allEvents}
        onOpenEvent={onOpenEvent}
        onAddToMessage={(line) => setMessage((m) => (m.includes(line) ? m : `${m.trimEnd()}\n\n${line}`))}
      />

      <section id="invite" className="detail__share" aria-labelledby={`${messageId}-h`}>
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
          {canNativeShare && (
            <button type="button" className="share-btn share-btn--lead" onClick={nativeShare}>
              <span className="share-btn__icon"><Share2 size={20} strokeWidth={2.25} aria-hidden="true" /></span>
              Share to an app
            </button>
          )}
          <button type="button" className={`share-btn${textOpen ? ' share-btn--on' : ''}`} aria-expanded={textOpen} onClick={() => setTextOpen((o) => !o)}>
            <span className="share-btn__icon"><MessageCircle size={20} strokeWidth={2.25} aria-hidden="true" /></span>
            Text friends
          </button>
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
        </div>

        {textOpen && <GroupText message={message} platform={platform} />}

        <p className="field-label">Post to social media</p>
        <div className="share-social">
          {socialTargets(message).map((s) => (
            <a key={s.id} className={`social social--${s.id}`} href={s.href} target="_blank" rel="noopener noreferrer" data-no-viewer="">
              {s.label}
            </a>
          ))}
          {PASTE_TARGETS.map((s) => (
            <a
              key={s.id}
              className={`social social--${s.id}`}
              href={appHref(s, platform)}
              data-web={s.href}
              data-no-viewer=""
              {...(platform === 'desktop' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => copyThenOpen(s)}
            >
              {s.label}
            </a>
          ))}
        </div>
        {fallback && (
          <p className="hint" role="status">
            {fallback.label} didn’t open?{' '}
            <a href={fallback.href} target="_blank" rel="noopener noreferrer">Open {fallback.label} on the web</a>
          </p>
        )}
        {pastedFor ? (
          <p className="hint hint--ok" role="status">
            <Check size={14} strokeWidth={3} aria-hidden="true" /> Message copied. In {pastedFor}, paste it into your post or caption.
          </p>
        ) : (
          <p className="hint">
            Opens the app if you have it. Instagram, TikTok, and Facebook copy your message first so you can paste it.
          </p>
        )}
        <p className="sr-only" role="status">{copied ? 'Message copied' : ''}</p>
      </section>
      <ReportProblem event={event} onHide={onNotForMe} />
    </div>
  )
}
