/**
 * Ticketmaster Discovery API (v2): concerts, sports, theater and family shows
 * at larger venues across the area. Needs a free API key from
 * https://developer.ticketmaster.com — set VITE_TICKETMASTER_KEY in a .env file.
 * Default quota: 5,000 calls a day, 5 a second.
 */
import type { AgeSuitability, Category, SceneEvent } from '../../types/event'
import { AREA, fetchJson } from './area'

export const TICKETMASTER_KEY: string | undefined = import.meta.env.VITE_TICKETMASTER_KEY

interface TmImage { url: string; width: number; ratio?: string }
export interface TmEvent {
  id: string
  name: string
  url?: string
  info?: string
  dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string } }
  classifications?: { segment?: { name?: string }; genre?: { name?: string } }[]
  priceRanges?: { min?: number; max?: number; currency?: string }[]
  images?: TmImage[]
  ageRestrictions?: { legalAgeEnforced?: boolean }
  _embedded?: { venues?: { name?: string; city?: { name?: string }; state?: { stateCode?: string }; location?: { latitude?: string; longitude?: string } }[] }
}

function categoryFor(e: TmEvent): Category {
  const seg = e.classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
  const genre = e.classifications?.[0]?.genre?.name?.toLowerCase() ?? ''
  if (seg === 'music') return 'music'
  if (seg === 'sports') return 'sports'
  if (seg === 'arts & theatre') return 'shows'
  if (seg === 'family' || genre.includes('family') || genre.includes('children')) return 'family'
  return 'shows'
}

function pickTmImage(images: TmImage[] = []): string | undefined {
  const wide = images.filter((i) => i.ratio === '16_9' && i.width >= 640).sort((a, b) => a.width - b.width)
  return (wide[0] ?? images[0])?.url
}

export function tmToScene(e: TmEvent): SceneEvent | null {
  const venue = e._embedded?.venues?.[0]
  const start = e.dates?.start
  if (!start?.localDate) return null
  const startIso = start.dateTime ?? new Date(`${start.localDate}T${start.localTime ?? '19:00:00'}`).toISOString()
  const price = e.priceRanges?.[0]
  const age: AgeSuitability = e.ageRestrictions?.legalAgeEnforced ? '21+' : categoryFor(e) === 'family' ? 'family' : 'all-ages'
  return {
    id: `tm-${e.id}`,
    title: e.name,
    category: categoryFor(e),
    tags: categoryFor(e) === 'family' ? ['family'] : categoryFor(e) === 'music' ? ['lively', 'live music'] : ['lively'],
    venue: venue?.name ?? 'Venue TBA',
    town: venue?.city?.name ? `${venue.city.name}, ${venue.state?.stateCode ?? ''}`.trim() : AREA.name,
    location: {
      lat: Number(venue?.location?.latitude ?? AREA.center.lat),
      lng: Number(venue?.location?.longitude ?? AREA.center.lng),
    },
    start: startIso,
    price: price?.min != null
      ? {
          min: { amountCents: Math.round(price.min * 100), currency: price.currency ?? 'USD' },
          max: price.max != null ? { amountCents: Math.round(price.max * 100), currency: price.currency ?? 'USD' } : null,
          status: 'confirmed',
        }
      : { min: null, max: null, status: 'missing' },
    age,
    local: false,
    description: e.info ?? `${e.classifications?.[0]?.genre?.name ?? 'Live event'} at ${venue?.name ?? 'a local venue'}.`,
    source: 'live',
    url: e.url,
    image: pickTmImage(e.images),
  }
}

export async function fetchTicketmaster(now: Date): Promise<SceneEvent[]> {
  if (!TICKETMASTER_KEY) throw new Error('needs-key')
  const params = new URLSearchParams({
    apikey: TICKETMASTER_KEY,
    latlong: `${AREA.center.lat},${AREA.center.lng}`,
    radius: String(AREA.radiusMiles),
    unit: 'miles',
    size: '100',
    sort: 'date,asc',
    startDateTime: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
  })
  const body = await fetchJson<{ _embedded?: { events?: TmEvent[] } }>(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
  )
  return (body._embedded?.events ?? []).map(tmToScene).filter((e): e is SceneEvent => e !== null)
}
