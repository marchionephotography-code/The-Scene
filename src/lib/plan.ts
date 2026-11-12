/**
 * Helpers for pulling off a night out once an event is picked: calendar
 * files, directions, parking notes, dinner nearby, and splitting the cost.
 * Everything here is pure so it can be tested.
 */
import type { GeoPoint, SceneEvent } from '../types/event'
import { distanceMiles } from './discovery'
import { formatMoney } from './money'
import type { Platform } from './share'

const DEFAULT_HOURS = 2

function endOf(e: SceneEvent): Date {
  return e.end ? new Date(e.end) : new Date(new Date(e.start).getTime() + DEFAULT_HOURS * 3600_000)
}

/** 20261107T190000Z */
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Commas, semicolons, and backslashes are escaped; newlines become \n (RFC 5545). */
function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** A one-event .ics file that Apple Calendar, Google, and Outlook all open. */
export function icsFile(e: SceneEvent, appName: string, now: Date = new Date()): string {
  const desc = [e.description, e.url ? `Details: ${e.url}` : '', e.source === 'sample' ? 'Sample listing, not a real event.' : '']
    .filter(Boolean)
    .join('\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${appName}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}@the-scene`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(new Date(e.start))}`,
    `DTEND:${icsStamp(endOf(e))}`,
    `SUMMARY:${icsText(e.title)}`,
    `LOCATION:${icsText(`${e.venue}, ${e.town}`)}`,
    `GEO:${e.location.lat};${e.location.lng}`,
    `DESCRIPTION:${icsText(desc)}`,
    ...(e.url ? [`URL:${e.url}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(e.title)} starts in 2 hours`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}

export function googleCalendarHref(e: SceneEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsStamp(new Date(e.start))}/${icsStamp(endOf(e))}`,
    location: `${e.venue}, ${e.town}`,
    details: [e.description, e.url ?? ''].filter(Boolean).join('\n\n'),
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

/** Apple Maps on iPhone (opens the app), Google Maps everywhere else. */
export function directionsHref(to: GeoPoint, label: string, platform: Platform): string {
  if (platform === 'ios') return `https://maps.apple.com/?daddr=${to.lat},${to.lng}&q=${encodeURIComponent(label)}`
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}`
}

/** A map search for restaurants around the venue. */
export function dinnerSearchHref(near: GeoPoint, platform: Platform): string {
  if (platform === 'ios') return `https://maps.apple.com/?q=restaurants&sll=${near.lat},${near.lng}&z=15`
  return `https://www.google.com/maps/search/restaurants/@${near.lat},${near.lng},15z`
}

/**
 * Food & drink events in the app near this one, on the same day and
 * finishing up before (or overlapping) its start: "dinner first" ideas.
 */
export function dinnerNearby(e: SceneEvent, all: SceneEvent[], maxMiles = 5): SceneEvent[] {
  const start = new Date(e.start)
  const dayKey = start.toDateString()
  return all
    .filter((x) => x.id !== e.id && x.category === 'food')
    .filter((x) => new Date(x.start).toDateString() === dayKey && new Date(x.start) < start)
    .filter((x) => distanceMiles(e.location, x.location) <= maxMiles)
    .sort((a, b) => distanceMiles(e.location, a.location) - distanceMiles(e.location, b.location))
    .slice(0, 3)
}

/** General parking tips by town. Kept generic on purpose; we don't know each lot. */
const PARKING: { match: RegExp; note: string }[] = [
  { match: /greenville/i, note: 'Downtown Greenville has public parking garages within a short walk of most venues. Street spots fill up fast on weekend nights.' },
  { match: /clemson/i, note: 'On Clemson game days, downtown and campus parking is limited and some lots charge. Leave extra time.' },
  { match: /anderson/i, note: 'Downtown Anderson has free street parking and public lots near Main Street.' },
  { match: /spartanburg/i, note: 'Downtown Spartanburg has public garages near Morgan Square.' },
]

export function parkingNote(e: SceneEvent): string {
  const hit = PARKING.find((p) => p.match.test(e.town))
  return hit ? hit.note : 'Check the venue’s website for parking before you go.'
}

export interface CostSplit {
  /** Lowest ticket price per person, in cents; 0 when free; null when unknown. */
  eachCents: number | null
  totalCents: number | null
}

export function splitCost(e: SceneEvent, people: number): CostSplit {
  const each = e.price.min === null ? (e.price.status === 'missing' ? null : 0) : e.price.min.amountCents
  return { eachCents: each, totalCents: each === null ? null : each * Math.max(1, people) }
}

/** "$12.00" → "12.00" for payment links. */
function amount(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** Strip @ / $ and anything that can't be in a handle. */
export function cleanHandle(h: string): string {
  return h.trim().replace(/^[@$]/, '').replace(/[^A-Za-z0-9_-]/g, '')
}

/** Links friends tap to pay the organizer back. */
export function paybackLinks(
  handles: { venmo?: string; cashapp?: string },
  eachCents: number,
  note: string,
): { id: 'venmo' | 'cashapp'; label: string; href: string }[] {
  const out: { id: 'venmo' | 'cashapp'; label: string; href: string }[] = []
  const v = cleanHandle(handles.venmo ?? '')
  const c = cleanHandle(handles.cashapp ?? '')
  if (v) out.push({ id: 'venmo', label: 'Venmo', href: `https://venmo.com/${v}?txn=pay&amount=${amount(eachCents)}&note=${encodeURIComponent(note)}` })
  if (c) out.push({ id: 'cashapp', label: 'Cash App', href: `https://cash.app/$${c}/${amount(eachCents)}` })
  return out
}

export function paybackLine(eachCents: number, links: { label: string; href: string }[]): string {
  if (!links.length) return ''
  return `Tickets are ${formatMoney({ amountCents: eachCents, currency: 'USD' })} each. Pay me back: ${links.map((l) => `${l.label} ${l.href}`).join(' · ')}`
}

/** Google's embeddable map (allowed inside the app's page viewer). */
export function mapEmbedHref(q: string, near: GeoPoint, zoom = 15): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&ll=${near.lat},${near.lng}&z=${zoom}&output=embed`
}
