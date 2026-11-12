export interface SearchArea {
  name: string
  center: { lat: number; lng: number }
  radiusMiles: number
}

/**
 * The default area: the Upstate plus the cities a day trip away (Atlanta,
 * Charlotte, Columbia, Asheville, Charleston). Centered on Anderson, SC.
 */
export const AREA: SearchArea = {
  name: 'Upstate SC and nearby cities',
  center: { lat: 34.5034, lng: -82.6501 }, // Anderson, SC
  radiusMiles: 220,
}

/**
 * Ticketing searches for the default area run once per hub, so a busy city
 * (Atlanta) can't crowd smaller towns out of a single 100-event page.
 */
export const REGION_HUBS: SearchArea[] = [
  { name: 'Greenville, SC', center: { lat: 34.8526, lng: -82.394 }, radiusMiles: 45 },
  { name: 'Asheville, NC', center: { lat: 35.5951, lng: -82.5515 }, radiusMiles: 35 },
  { name: 'Charlotte, NC', center: { lat: 35.2271, lng: -80.8431 }, radiusMiles: 35 },
  { name: 'Columbia, SC', center: { lat: 34.0007, lng: -81.0348 }, radiusMiles: 35 },
  { name: 'Athens, GA', center: { lat: 33.9519, lng: -83.3576 }, radiusMiles: 30 },
  { name: 'Atlanta, GA', center: { lat: 33.749, lng: -84.388 }, radiusMiles: 30 },
  { name: 'Charleston, SC', center: { lat: 32.7765, lng: -79.9311 }, radiusMiles: 30 },
]

/** Wait between requests to one API (Ticketmaster allows 5 a second). */
export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Runs one search per area in turn and merges the results, keeping the first copy of each id. */
export async function searchEach<T extends { id: string }>(areas: SearchArea[], run: (a: SearchArea) => Promise<T[]>, gapMs = 250): Promise<T[]> {
  const out = new Map<string, T>()
  let ok = 0
  let lastErr: unknown
  for (const [i, a] of areas.entries()) {
    if (i) await pause(gapMs)
    try {
      for (const e of await run(a)) if (!out.has(e.id)) out.set(e.id, e)
      ok++
    } catch (err) {
      lastErr = err
      if (err instanceof Error && err.message === 'needs-key') throw err
    }
  }
  if (!ok) throw lastErr ?? new Error('unavailable')
  return [...out.values()]
}

/** "2026-10-31" for API date filters. */
export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function fetchJson<T>(url: string, timeoutMs = 7000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}
