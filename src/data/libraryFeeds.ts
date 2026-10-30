/**
 * Public library event calendars.
 *
 * Anderson County Library and Oconee County Public Library run their calendars
 * on WordPress with "The Events Calendar" plugin, which normally publishes a
 * free public JSON feed at /wp-json/tribe/events/v1/events. Those feed URLs
 * are listed below but have NOT been verified from this project yet; if a
 * library's feed can't be reached, the app keeps working with sample data and
 * reports that library as unavailable.
 *
 * Pickens County Library uses Communico, which needs an API key from the
 * library, and Greenville County Library's calendar platform hasn't been
 * identified yet, so neither is connected.
 */
import type { AgeSuitability, Category, GeoPoint, SceneEvent } from '../types/event'

export interface LibraryFeed {
  id: string
  name: string
  url: string
  /** Used when an event has no venue coordinates. */
  fallback: GeoPoint & { town: string }
}

export const LIBRARY_FEEDS: LibraryFeed[] = [
  {
    id: 'anderson',
    name: 'Anderson County Library',
    url: 'https://www.andersonlibrary.org/wp-json/tribe/events/v1/events',
    fallback: { lat: 34.5034, lng: -82.6501, town: 'Anderson, SC' },
  },
  {
    id: 'oconee',
    name: 'Oconee County Public Library',
    url: 'https://oconeelibrary.org/wp-json/tribe/events/v1/events',
    fallback: { lat: 34.7473, lng: -83.0593, town: 'Walhalla, SC' },
  },
]

/** The parts of a "The Events Calendar" REST event that SCENE uses. */
export interface TribeEvent {
  id: number
  title: string
  description?: string
  url?: string
  start_date: string // "2026-10-31 10:00:00", the library's local time
  end_date?: string
  cost?: string
  venue?: { venue?: string; city?: string; state?: string; geo_lat?: number | string; geo_lng?: number | string } | unknown[]
  categories?: { name: string }[]
  tags?: { name: string }[]
  /** Featured image; the API sends `false` when there is none. */
  image?: { url?: string; sizes?: Record<string, { url?: string; width?: number }> } | false
}

export interface LibraryResult {
  feed: LibraryFeed
  status: 'ok' | 'unavailable'
  events: SceneEvent[]
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&#8217;': '’', '&#8211;': '–', '&#8212;': '—', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' }

/** Strip HTML tags and decode the entities WordPress commonly emits. */
export function plainText(html = ''): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[#a-z0-9]+;/gi, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
}

/** "2026-10-31 10:00:00" → ISO string, read as the viewer's local time (Upstate SC is one time zone). */
function parseLocal(s: string): string {
  const [d, t = '00:00:00'] = s.split(' ')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = t.split(':').map(Number)
  return new Date(y, m - 1, day, hh, mm).toISOString()
}

const KIDS = /\b(story ?time|storytime|kid|kids|child|children|toddler|baby|babies|preschool|family|families|lego|stem|steam|tween|youth|homeschool)\b/i

function categorize(text: string): Category {
  if (KIDS.test(text)) return 'family'
  if (/\b(music|concert|band|sing|choir)\b/i.test(text)) return 'music'
  if (/\b(movie|film|theater|theatre|puppet|magic)\b/i.test(text)) return 'shows'
  if (/\b(garden|hike|nature|outdoor|walk)\b/i.test(text)) return 'outdoors'
  if (/\b(cook|food|baking|tea|coffee)\b/i.test(text)) return 'food'
  return 'arts'
}

function ageFor(text: string): AgeSuitability {
  if (/\b(adults? only|18\+|ages 18|21\+)\b/i.test(text)) return '18+'
  if (KIDS.test(text)) return 'family'
  return 'all-ages'
}

function priceFor(cost = ''): SceneEvent['price'] {
  const c = cost.trim()
  if (!c || /free/i.test(c)) return { min: null, max: null, status: 'confirmed' }
  const n = Number(c.replace(/[^0-9.]/g, ''))
  if (Number.isFinite(n) && n > 0) return { min: { amountCents: Math.round(n * 100), currency: 'USD' }, max: null, status: 'confirmed' }
  return { min: null, max: null, status: 'missing' }
}

/** Pick a card-sized version of the event's featured image (about 600–1200px wide). */
export function pickImage(image: TribeEvent['image']): string | undefined {
  if (!image) return undefined
  const sizes = Object.values(image.sizes ?? {}).filter((s) => s.url && s.width)
  const fit = sizes
    .filter((s) => (s.width ?? 0) >= 600)
    .sort((a, b) => (a.width ?? 0) - (b.width ?? 0))[0]
  const url = fit?.url ?? image.url
  return url && /^https:\/\//.test(url) ? url : undefined
}

export function toSceneEvent(e: TribeEvent, feed: LibraryFeed): SceneEvent {
  const venue = Array.isArray(e.venue) ? undefined : (e.venue as Exclude<TribeEvent['venue'], unknown[]>)
  const lat = Number(venue?.geo_lat)
  const lng = Number(venue?.geo_lng)
  const labels = [...(e.categories ?? []), ...(e.tags ?? [])].map((c) => c.name).join(' ')
  const text = `${e.title} ${labels} ${plainText(e.description)}`
  const category = categorize(text)
  const desc = plainText(e.description)
  return {
    id: `${feed.id}-${e.id}`,
    title: plainText(e.title),
    category,
    tags: ['library', ...(category === 'family' ? ['family'] : []), ...(/craft|make|build|lego/i.test(text) ? ['creative', 'hands-on'] : [])],
    venue: plainText(venue?.venue) || feed.name,
    town: venue?.city ? `${venue.city}, ${venue.state ?? 'SC'}` : feed.fallback.town,
    location: Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 ? { lat, lng } : { lat: feed.fallback.lat, lng: feed.fallback.lng },
    start: parseLocal(e.start_date),
    end: e.end_date ? parseLocal(e.end_date) : undefined,
    price: priceFor(e.cost),
    age: ageFor(text),
    local: true,
    description: desc.length > 220 ? `${desc.slice(0, 217).trimEnd()}…` : desc,
    source: 'live',
    host: { name: feed.name, kind: 'library' },
    url: e.url,
    image: pickImage(e.image),
  }
}

export async function fetchLibrary(feed: LibraryFeed, now: Date, timeoutMs = 6000): Promise<LibraryResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const res = await fetch(`${feed.url}?per_page=50&start_date=${start}`, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = (await res.json()) as { events?: TribeEvent[] }
    return { feed, status: 'ok', events: (body.events ?? []).map((e) => toSceneEvent(e, feed)) }
  } catch {
    return { feed, status: 'unavailable', events: [] }
  } finally {
    clearTimeout(timer)
  }
}
