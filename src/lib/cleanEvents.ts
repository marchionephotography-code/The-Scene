/**
 * Cleans the merged event list before anyone sees it:
 *  - reads "CANCELLED" / "POSTPONED" / "RESCHEDULED" notes in titles (many
 *    calendars only say it there) and tidies the title
 *  - removes cancelled events
 *  - merges near-duplicates: the same show from two sources, or listed with
 *    slightly different names or times, keeping the most complete copy
 */
import type { EventStatus, SceneEvent } from '../types/event'
import { distanceMiles } from './discovery'

const STATUS_WORDS: [RegExp, EventStatus][] = [
  [/\b(cancell?ed|canceled)\b/i, 'cancelled'],
  [/\bpostponed\b/i, 'postponed'],
  [/\b(rescheduled|new date)\b/i, 'rescheduled'],
]

/** Takes a status out of the title, e.g. "POSTPONED: Jazz Night" → Jazz Night + postponed. */
export function readStatus(e: SceneEvent): SceneEvent {
  let status: EventStatus = e.status ?? 'scheduled'
  let title = e.title
  for (const [re, s] of STATUS_WORDS) {
    if (re.test(title)) {
      if (status === 'scheduled' || s === 'cancelled') status = s
      title = title.replace(new RegExp(`\\s*[-–—:|(\\[]*\\s*${re.source}\\s*[)\\]]?\\s*[-–—:|]*\\s*`, 'i'), ' ').trim()
    }
  }
  return title === e.title && status === (e.status ?? 'scheduled') ? e : { ...e, title: title || e.title, status }
}

const FILLER = new Set(['the', 'a', 'an', 'and', 'live', 'presents', 'present', 'tickets', 'ticket', 'show', 'concert', 'event', 'at', 'in', 'with', 'feat', 'featuring', 'tour', 'night', 'free'])

function words(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w))
}

/** How alike two titles are, 0 to 1 (shared words over all words). */
export function titleSimilarity(a: string, b: string): number {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (!A.size || !B.size) return 0
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  // Containment counts: "Jazz on the Lawn" vs "Jazz on the Lawn – Free Concert".
  return Math.max(shared / new Set([...A, ...B]).size, shared / Math.min(A.size, B.size) >= 1 ? 0.9 : 0)
}

export function sameEvent(a: SceneEvent, b: SceneEvent): boolean {
  const minutes = Math.abs(new Date(a.start).getTime() - new Date(b.start).getTime()) / 60000
  if (minutes > 90) return false
  const sameDay = new Date(a.start).toDateString() === new Date(b.start).toDateString()
  if (!sameDay) return false
  const near = distanceMiles(a.location, b.location) <= 0.75 || words(a.venue).join(' ') === words(b.venue).join(' ')
  return near && titleSimilarity(a.title, b.title) >= 0.6
}

/** The copy with more to show wins: a photo, a price, a link, a description. */
function richness(e: SceneEvent): number {
  return (e.image ? 4 : 0) + (e.price.min || e.price.status === 'confirmed' ? 2 : 0) + (e.url ? 1 : 0) + Math.min(e.description.length, 200) / 200
}

export function cleanEvents(events: SceneEvent[]): SceneEvent[] {
  const out: SceneEvent[] = []
  for (const raw of events) {
    const e = readStatus(raw)
    if (e.status === 'cancelled') continue
    const i = out.findIndex((x) => sameEvent(x, e))
    if (i === -1) {
      out.push(e)
    } else if (richness(e) > richness(out[i])) {
      // Keep the better copy, but never lose a postponed/rescheduled warning.
      out[i] = { ...e, status: e.status !== 'scheduled' ? e.status : out[i].status }
    } else if (e.status && e.status !== 'scheduled') {
      out[i] = { ...out[i], status: e.status }
    }
  }
  return out
}
