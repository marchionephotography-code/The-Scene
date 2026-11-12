/**
 * Link previews for shared events (/e/<id>). Chat apps and social sites read
 * the page's og: tags without running the app, so this fills them in on the
 * server: the event's name, time and place, and its photo when it has one.
 * Ticketmaster events are looked up by id; others keep the general preview.
 */
declare const Netlify: { env: { get(name: string): string | undefined } }
interface Context { next(): Promise<Response> }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

interface TmEvent {
  name?: string
  dates?: { start?: { localDate?: string; localTime?: string } }
  images?: { url: string; width: number; ratio?: string }[]
  _embedded?: { venues?: { name?: string; city?: { name?: string }; state?: { stateCode?: string } }[] }
}

function when(d?: { localDate?: string; localTime?: string }): string {
  if (!d?.localDate) return ''
  const dt = new Date(`${d.localDate}T${d.localTime ?? '12:00:00'}`)
  const day = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.localTime ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
  return [day, time].filter(Boolean).join(' · ')
}

export default async function handler(req: Request, context: Context): Promise<Response> {
  const page = await context.next()
  const id = decodeURIComponent(new URL(req.url).pathname.split('/')[2] ?? '')
  const key = Netlify.env.get('TICKETMASTER_KEY')
  if (!id.startsWith('tm-') || !key || !(page.headers.get('content-type') ?? '').includes('text/html')) return page

  try {
    const r = await fetch(`https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(id.slice(3))}.json?apikey=${key}`)
    if (!r.ok) return page
    const e = (await r.json()) as TmEvent
    const v = e._embedded?.venues?.[0]
    const title = e.name ?? 'The Scene'
    const desc = [when(e.dates?.start), v?.name, v?.city?.name && `${v.city.name}, ${v.state?.stateCode ?? ''}`].filter(Boolean).join(' · ')
    const img = (e.images ?? []).filter((i) => i.ratio === '16_9').sort((a, b) => b.width - a.width)[0]?.url
    let html = await page.text()
    html = html
      .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
      .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc || 'On The Scene')}" />`)
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · The Scene</title>`)
    if (img) html = html.replace(/<meta property="og:image" [^>]*>/, `<meta property="og:image" content="${esc(img)}" />`)
    const headers = new Headers(page.headers)
    headers.delete('content-length')
    headers.set('cache-control', 'public, max-age=600')
    return new Response(html, { status: page.status, headers })
  } catch {
    return page
  }
}

export const config = { path: '/e/*' }
