/**
 * City search for the location picker, using Open-Meteo's free geocoding API
 * (no key, works from the browser): https://open-meteo.com/en/docs/geocoding-api
 */
import { US_CITIES } from '../data/usCities'
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

const STATE_NAMES = Object.fromEntries(Object.entries(STATES).map(([name, abbr]) => [abbr, name.toLowerCase()]))

/**
 * Instant answers from the built-in list. Matches the start of the city name
 * ("char" finds Charlotte and Charleston); "city, st" or "city st" narrows to
 * a state. Best matches (exact, then shortest name) come first.
 */
export function searchLocal(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ')
  if (q.length < 2) return []
  const m = q.match(/^(.*?)[,\s]+([a-z]{2}|[a-z ]{4,})$/)
  const tries = m ? [{ city: m[1].trim(), st: m[2].trim() }, { city: q, st: '' }] : [{ city: q, st: '' }]
  for (const { city, st } of tries) {
    const hits = US_CITIES.filter(([name, abbr]) => {
      const n = name.toLowerCase()
      const stOk = !st || abbr.toLowerCase() === st || (STATE_NAMES[abbr] ?? '').startsWith(st)
      return stOk && (n.startsWith(city) || n.split(/[\s-]/).some((w) => w.startsWith(city)))
    })
    if (hits.length) {
      return hits
        .sort((a, b) => Number(b[0].toLowerCase() === city) - Number(a[0].toLowerCase() === city) || a[0].length - b[0].length)
        .slice(0, limit)
        .map(([name, abbr, lat, lng]) => ({ label: `${name}, ${abbr}`, point: { lat, lng } }))
    }
  }
  return []
}

/** Built-in matches first, then anything extra the online lookup finds. */
export function mergePlaces(local: Place[], online: Place[], limit = 8): Place[] {
  const seen = new Set(local.map((p) => p.label))
  return [...local, ...online.filter((p) => !seen.has(p.label))].slice(0, limit)
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
