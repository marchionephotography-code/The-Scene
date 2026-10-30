/**
 * SeatGeek Platform API: sports, concerts and theater. Needs a free client ID
 * from https://seatgeek.com/account/develop — set VITE_SEATGEEK_CLIENT_ID.
 */
import type { Category, SceneEvent } from '../../types/event'
import { AREA, fetchJson } from './area'

export const SEATGEEK_CLIENT_ID: string | undefined = import.meta.env.VITE_SEATGEEK_CLIENT_ID

export interface SgEvent {
  id: number
  title: string
  url?: string
  type?: string
  datetime_local?: string
  datetime_tbd?: boolean
  venue?: { name?: string; city?: string; state?: string; location?: { lat?: number; lon?: number } }
  stats?: { lowest_price?: number | null; highest_price?: number | null }
  performers?: { image?: string | null }[]
}

function categoryFor(type = ''): Category {
  if (type.includes('concert') || type.includes('music') || type.includes('festival')) return 'music'
  if (type.includes('theater') || type.includes('comedy') || type.includes('broadway') || type.includes('dance')) return 'shows'
  if (type.includes('family')) return 'family'
  return 'sports'
}

export function sgToScene(e: SgEvent): SceneEvent | null {
  if (!e.datetime_local || e.datetime_tbd) return null
  const cat = categoryFor(e.type)
  const low = e.stats?.lowest_price
  const high = e.stats?.highest_price
  return {
    id: `sg-${e.id}`,
    title: e.title,
    category: cat,
    tags: cat === 'family' ? ['family'] : ['lively'],
    venue: e.venue?.name ?? 'Venue TBA',
    town: e.venue?.city ? `${e.venue.city}, ${e.venue.state ?? ''}`.trim() : AREA.name,
    location: { lat: e.venue?.location?.lat ?? AREA.center.lat, lng: e.venue?.location?.lon ?? AREA.center.lng },
    start: new Date(e.datetime_local).toISOString(),
    // Resale listing prices change constantly, so they are an estimate, not a confirmed price.
    price: low != null
      ? { min: { amountCents: Math.round(low * 100), currency: 'USD' }, max: high != null ? { amountCents: Math.round(high * 100), currency: 'USD' } : null, status: 'estimate' }
      : { min: null, max: null, status: 'missing' },
    age: cat === 'family' ? 'family' : 'all-ages',
    local: false,
    description: `${e.type?.replace(/_/g, ' ') ?? 'Event'} at ${e.venue?.name ?? 'a local venue'}.`,
    source: 'live',
    url: e.url,
    image: e.performers?.find((p) => p.image)?.image ?? undefined,
  }
}

export async function fetchSeatGeek(now: Date): Promise<SceneEvent[]> {
  if (!SEATGEEK_CLIENT_ID) throw new Error('needs-key')
  const params = new URLSearchParams({
    client_id: SEATGEEK_CLIENT_ID,
    lat: String(AREA.center.lat),
    lon: String(AREA.center.lng),
    range: `${AREA.radiusMiles}mi`,
    per_page: '100',
    sort: 'datetime_local.asc',
    'datetime_local.gte': now.toISOString().slice(0, 19),
  })
  const body = await fetchJson<{ events?: SgEvent[] }>(`https://api.seatgeek.com/2/events?${params}`)
  return (body.events ?? []).map(sgToScene).filter((e): e is SceneEvent => e !== null)
}
