/**
 * Server-side Ticketmaster search: GET /api/ticketmaster?lat=&lng=&radius=&size=
 * or GET /api/ticketmaster?id=<event id> for one event.
 *
 * The API key lives only here (TICKETMASTER_KEY in Netlify's environment
 * settings), never in the browser. Results are cached at Netlify's edge for
 * 15 minutes, so thousands of visitors cost a handful of Ticketmaster calls
 * and stay well inside the 5,000-a-day limit.
 */
declare const Netlify: { env: { get(name: string): string | undefined } }

const TM = 'https://app.ticketmaster.com/discovery/v2'

function num(v: string | null, min: number, max: number): number | null {
  const n = Number(v)
  return v !== null && Number.isFinite(n) && n >= min && n <= max ? n : null
}

function json(body: unknown, status = 200, cache = true): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache ? 'public, max-age=300' : 'no-store',
      'netlify-cdn-cache-control': cache ? 'public, durable, s-maxage=900, stale-while-revalidate=3600' : 'no-store',
    },
  })
}

export default async function handler(req: Request): Promise<Response> {
  const key = Netlify.env.get('TICKETMASTER_KEY')
  if (!key) return json({ error: 'needs-key' }, 503, false)
  const q = new URL(req.url).searchParams

  const id = q.get('id')
  if (id !== null) {
    if (!/^[A-Za-z0-9_-]{4,40}$/.test(id)) return json({ error: 'bad id' }, 400, false)
    const res = await fetch(`${TM}/events/${id}.json?apikey=${key}`)
    return res.ok ? json(await res.json()) : json({ error: 'not found' }, res.status === 404 ? 404 : 502, false)
  }

  const lat = num(q.get('lat'), -90, 90)
  const lng = num(q.get('lng'), -180, 180)
  const radius = num(q.get('radius'), 1, 250) ?? 50
  const size = num(q.get('size'), 1, 100) ?? 50
  if (lat === null || lng === null) return json({ error: 'lat and lng are required' }, 400, false)

  // Round so nearby searches share one cached answer; start from the current hour.
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const params = new URLSearchParams({
    apikey: key,
    latlong: `${lat.toFixed(2)},${lng.toFixed(2)}`,
    radius: String(Math.round(radius)),
    unit: 'miles',
    size: String(Math.round(size)),
    sort: 'date,asc',
    startDateTime: start.toISOString().replace(/\.\d{3}Z$/, 'Z'),
  })
  const res = await fetch(`${TM}/events.json?${params}`)
  if (!res.ok) return json({ error: 'ticketmaster unavailable' }, 502, false)
  return json(await res.json())
}

export const config = { path: '/api/ticketmaster' }
