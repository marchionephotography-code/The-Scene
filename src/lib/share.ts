import type { SceneEvent } from '../types/event'
import { formatPriceRange } from './money'

/** "Sat, Oct 31 · 7:30 PM" */
export function formatShareWhen(startIso: string, locale?: string): string {
  const d = new Date(startIso)
  const day = d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

/**
 * The default message for texting, emailing, or posting an event.
 * Sample events say so, so nobody mistakes a demo listing for a real one.
 */
export function buildShareText(event: SceneEvent, locale?: string): string {
  const lines = [
    `Want to go? ${event.title}`,
    `${formatShareWhen(event.start, locale)} at ${event.venue}, ${event.town}`,
    `Price: ${formatPriceRange(event.price, locale)}`,
  ]
  if (event.source === 'sample') lines.push('', '(Sample listing from the SCENE demo, not a real event yet.)')
  return lines.join('\n')
}

/** Opens Messages with the text filled in. `?&body=` works on both iOS and Android. */
export function smsHref(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`
}

export function mailtoHref(subject: string, body: string, to = ''): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export interface SocialTarget {
  id: 'x' | 'threads' | 'bluesky' | 'whatsapp'
  label: string
  href: string
}

/** Networks that accept a pre-written post from a web link. */
export function socialTargets(text: string): SocialTarget[] {
  const t = encodeURIComponent(text)
  return [
    { id: 'x', label: 'X', href: `https://x.com/intent/post?text=${t}` },
    { id: 'threads', label: 'Threads', href: `https://www.threads.net/intent/post?text=${t}` },
    { id: 'bluesky', label: 'Bluesky', href: `https://bsky.app/intent/compose?text=${t}` },
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${t}` },
  ]
}
