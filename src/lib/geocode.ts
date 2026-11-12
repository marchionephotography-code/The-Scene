/**
 * City search for the location picker, using Open-Meteo's free geocoding API
 * (no key, works from the browser): https://open-meteo.com/en/docs/geocoding-api
 */
import type { GeoPoint } from '../types/event'

export interface Place {
  /** "Charlotte, NC" */
  label: string
  point: GeoPoint
  /** Extra line for telling same-named places apart, e.g. "Mecklenburg County". */
  detail?: string
}

const STATES: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT',
  Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  'Puerto Rico': 'PR',
}

interface OmResult {
  name: string
  latitude: number
  longitude: number
  admin1?: string
  admin2?: string
  feature_code?: string
  population?: number
}

export function parsePlaces(json: { results?: OmResult[] }): Place[] {
  const seen = new Set<string>()
  return (json.results ?? [])
    // Cities, towns, and villages only (PPL*), not lakes or counties.
    .filter((r) => !r.feature_code || r.feature_code.startsWith('PPL'))
    .map((r) => {
      const st = r.admin1 ? STATES[r.admin1] ?? r.admin1 : ''
      return {
        label: st ? `${r.name}, ${st}` : r.name,
        point: { lat: r.latitude, lng: r.longitude },
        detail: r.admin2,
      }
    })
    .filter((p) => (seen.has(p.label) ? false : (seen.add(p.label), true)))
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const p = new URLSearchParams({ name: q, count: '8', language: 'en', format: 'json', countryCode: 'US' })
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${p}`, { signal })
  if (!res.ok) throw new Error(`geocode ${res.status}`)
  return parsePlaces(await res.json())
}

/** Quick picks: the Upstate, then cities within a day trip. */
export const NEARBY_CITIES: Place[] = [
  { label: 'Spartanburg, SC', point: { lat: 34.9496, lng: -81.932 } },
  { label: 'Asheville, NC', point: { lat: 35.5951, lng: -82.5515 } },
  { label: 'Charlotte, NC', point: { lat: 35.2271, lng: -80.8431 } },
  { label: 'Columbia, SC', point: { lat: 34.0007, lng: -81.0348 } },
  { label: 'Athens, GA', point: { lat: 33.9519, lng: -83.3576 } },
  { label: 'Atlanta, GA', point: { lat: 33.749, lng: -84.388 } },
  { label: 'Charleston, SC', point: { lat: 32.7765, lng: -79.9311 } },
]
