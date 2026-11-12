/**
 * Venue photos from Google Places: GET /api/place-photo?q=<venue>&near=<town>
 * Returns { url, credit: [{ name, uri }] } or { url: null } when Google has none.
 *
 * The key lives only here (GOOGLE_PLACES_KEY in Netlify's environment
 * settings). Google requires showing each photo's author credit and
 * "Google Maps" next to the photo; the app does both. Answers are cached at
 * Netlify's edge for a day, so each venue costs about one lookup a day no
 * matter how many people see it.
 */
declare const Netlify: { env: { get(name: string): string | undefined } }

const PLACES = 'https://places.googleapis.com/v1'

function json(body: unknown, status = 200, cache = true): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache ? 'public, max-age=3600' : 'no-store',
      'netlify-cdn-cache-control': cache ? 'public, durable, s-maxage=86400, stale-while-revalidate=86400' : 'no-store',
    },
  })
}

const clean = (v: string | null, max: number) =>
  [...(v ?? '')].map((c) => (c.charCodeAt(0) < 32 || c === '<' || c === '>' ? ' ' : c)).join('').replace(/\s+/g, ' ').trim().slice(0, max)

interface Place {
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[]
}

export default async function handler(req: Request): Promise<Response> {
  const key = Netlify.env.get('GOOGLE_PLACES_KEY')
  if (!key) return json({ error: 'needs-key' }, 503, false)
  const q = new URL(req.url).searchParams
  const venue = clean(q.get('q'), 120)
  const near = clean(q.get('near'), 80)
  if (venue.length < 2) return json({ error: 'q is required' }, 400, false)

  const search = await fetch(`${PLACES}/places:searchText`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.photos' },
    body: JSON.stringify({ textQuery: near ? `${venue}, ${near}` : venue, pageSize: 1 }),
  })
  if (!search.ok) return json({ error: 'places unavailable' }, 502, false)
  const place = ((await search.json()) as { places?: Place[] }).places?.[0]
  const photo = place?.photos?.[0]
  if (!photo) return json({ url: null })

  const media = await fetch(`${PLACES}/${photo.name}/media?maxWidthPx=900&skipHttpRedirect=true&key=${encodeURIComponent(key)}`)
  if (!media.ok) return json({ error: 'photo unavailable' }, 502, false)
  const { photoUri } = (await media.json()) as { photoUri?: string }
  if (!photoUri) return json({ url: null })
  const credit = (photo.authorAttributions ?? [])
    .filter((a) => a.displayName)
    .map((a) => ({ name: a.displayName!, uri: a.uri && /^https:\/\//.test(a.uri) ? a.uri : undefined }))
  return json({ url: photoUri, credit })
}

export const config = { path: '/api/place-photo' }
