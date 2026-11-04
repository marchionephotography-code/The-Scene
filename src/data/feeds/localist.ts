/**
 * Localist calendars (used by many universities and cities). Clemson's public
 * university calendar runs on it; the API is open and needs no key:
 * https://developer.localist.com/doc/api
 *
 * Only events that fit The Scene (shows, music, sports, arts, family,
 * outdoors, food) are kept; lectures, meetings, and deadlines are dropped.
 */
import type { Category, EventPrice, SceneEvent } from '../../types/event'
import { fetchJson } from './area'

export interface LocalistFeed {
  id: string
  name: string
  /** Calendar base URL, e.g. https://calendar.clemson.edu */
  base: string
  /** Town used when an event has no city. */
  town: string
  fallback: { lat: number; lng: number }
}

export const LOCALIST_FEEDS: LocalistFeed[] = [
  { id: 'clemson', name: 'Clemson University calendar', base: 'https://calendar.clemson.edu', town: 'Clemson, SC', fallback: { lat: 34.6782, lng: -82.8374 } },
]

interface LxFilter { name: string }
export interface LxEvent {
  id: number
  title: string
  description_text?: string
  location_name?: string
  room_number?: string
  address?: string
  geo?: { latitude?: string | null; longitude?: string | null; city?: string | null; state?: string | null }
  photo_url?: string
  localist_url?: string
  ticket_url?: string
  ticket_cost?: string | null
  free?: boolean
  private?: boolean
  keywords?: string[]
  tags?: string[]
  filters?: { event_types?: LxFilter[]; event_audience?: LxFilter[] }
  event_instances?: { event_instance: { start: string; end?: string | null; all_day?: boolean } }[]
}

const RULES: { match: RegExp; category: Category; tags: string[] }[] = [
  { match: /athletic|sport|game|tiger|volleyball|basketball|baseball|soccer|football/i, category: 'sports', tags: ['lively', 'competitive'] },
  { match: /concert|music|band|orchestra|choir|jazz|recital/i, category: 'music', tags: ['live music'] },
  { match: /theat|performance|perform|comedy|dance|film|movie|screening/i, category: 'shows', tags: ['date night'] },
  { match: /exhibit|gallery|art|museum/i, category: 'arts', tags: ['creative', 'chill'] },
  { match: /garden|hike|outdoor|nature|trail|botanical/i, category: 'outdoors', tags: ['outdoors', 'chill'] },
  { match: /family|kids|children/i, category: 'family', tags: ['family'] },
  { match: /food|dinner|tasting|market|brunch/i, category: 'food', tags: ['social'] },
]

const SKIP = /lecture|seminar|workshop|meeting|deadline|webinar|info session|orientation|thesis|dissertation|defense|training|registration|career|class|exam|office hours/i

function classify(e: LxEvent): { category: Category; tags: string[] } | null {
  const types = (e.filters?.event_types ?? []).map((t) => t.name).join(' ')
  const words = [types, ...(e.keywords ?? []), ...(e.tags ?? []), e.title].join(' ')
  if (SKIP.test(`${types} ${e.title}`)) return null
  const rule = RULES.find((r) => r.match.test(words))
  return rule ? { category: rule.category, tags: rule.tags } : null
}

/** "$10", "$5-$15", "Free" → cents. Anything else counts as unknown. */
export function parseCost(cost: string | null | undefined, free?: boolean): EventPrice {
  if (free) return { min: null, max: null, status: 'confirmed' }
  const nums = (cost ?? '').match(/\d+(?:\.\d{1,2})?/g)?.map(Number) ?? []
  if (/free/i.test(cost ?? '') && !nums.length) return { min: null, max: null, status: 'confirmed' }
  if (!nums.length) return { min: null, max: null, status: 'missing' }
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  return {
    min: { amountCents: Math.round(lo * 100), currency: 'USD' },
    max: hi !== lo ? { amountCents: Math.round(hi * 100), currency: 'USD' } : null,
    status: 'estimate',
  }
}

export function lxToScene(e: LxEvent, feed: LocalistFeed): SceneEvent | null {
  if (e.private) return null
  const inst = e.event_instances?.[0]?.event_instance
  if (!inst?.start || inst.all_day) return null
  const kind = classify(e)
  if (!kind) return null
  const lat = Number(e.geo?.latitude)
  const lng = Number(e.geo?.longitude)
  const audience = (e.filters?.event_audience ?? []).map((a) => a.name).join(' ')
  return {
    id: `lx-${feed.id}-${e.id}`,
    title: e.title,
    category: kind.category,
    tags: kind.tags,
    venue: e.location_name || feed.name,
    town: e.geo?.city ? `${e.geo.city}, ${e.geo.state ?? 'SC'}` : feed.town,
    location: Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 ? { lat, lng } : feed.fallback,
    start: new Date(inst.start).toISOString(),
    end: inst.end ? new Date(inst.end).toISOString() : undefined,
    price: parseCost(e.ticket_cost, e.free),
    age: /family|kids|children/i.test(audience) ? 'family' : 'all-ages',
    local: true,
    description: (e.description_text ?? '').replace(/\s+/g, ' ').trim().slice(0, 220) || `At ${e.location_name ?? feed.name}.`,
    source: 'live',
    url: e.localist_url ?? e.ticket_url,
    image: e.photo_url && e.photo_url.startsWith('https://') && !/default|placeholder/i.test(e.photo_url)
      ? e.photo_url.replace('/huge/', '/big/')
      : undefined,
  }
}

export async function fetchLocalist(feed: LocalistFeed): Promise<SceneEvent[]> {
  const body = await fetchJson<{ events?: { event: LxEvent }[] }>(`${feed.base}/api/2/events?days=60&pp=100`)
  return (body.events ?? []).map((x) => lxToScene(x.event, feed)).filter((e): e is SceneEvent => e !== null)
}
