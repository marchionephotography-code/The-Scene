/**
 * Every event has its own address: /e/<id>. Opening it lands on The Scene
 * with that event showing; sharing it gives friends something to tap (and,
 * on the live site, a preview card with the event's name and photo).
 */
const embedded = (() => {
  try { return window.top !== window.self } catch { return true }
})()

/** The public address of the site, e.g. https://thescene.app. Empty in previews. */
export function siteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '')
  if (configured) return configured
  if (embedded || !/^https?:$/.test(window.location.protocol)) return ''
  return window.location.origin
}

/** Where the app itself lives; the landing page is at /. */
export const APP_PATH = '/app/'

export function eventPath(id: string): string {
  return `/e/${encodeURIComponent(id)}`
}

export function eventUrl(id: string): string {
  const base = siteUrl()
  return base ? `${base}${eventPath(id)}` : ''
}

/** The event id in the current address, if any. */
export function eventIdFromLocation(loc: Location = window.location): string | null {
  const m = loc.pathname.match(/\/e\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

/** Keeps the address bar in step with the open event (not in previews, where the address isn't ours). */
export function showEventInAddress(id: string | null): void {
  if (embedded) return
  try {
    const want = id ? eventPath(id) : APP_PATH
    if (window.location.pathname !== want) window.history.replaceState(window.history.state, '', want + window.location.hash)
  } catch {
    // Address can't be changed here; links still work.
  }
}
