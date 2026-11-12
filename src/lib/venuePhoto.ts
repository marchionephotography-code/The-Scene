/**
 * Photos of the venue, from Google Places, for live events that come without
 * their own picture. Goes through our server (/api/place-photo) so the key
 * stays private. Answers are remembered on the device for a day, and if the
 * site has no Google key yet the app stops asking for the rest of the visit.
 */
import { useEffect, useState } from 'react'
import type { SceneEvent } from '../types/event'

export interface VenuePhoto { url: string; credit: { name: string; uri?: string }[] }

const DAY = 24 * 60 * 60 * 1000
const STORE = 'scene:venue-photos'
const memory = new Map<string, VenuePhoto | null>()
const pending = new Map<string, Promise<VenuePhoto | null>>()
let off = false

export function venueKey(e: Pick<SceneEvent, 'venue' | 'town'>): string {
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, ' ').trim()
  return `${norm(e.venue)}|${norm(e.town)}`
}

/** Live events with a real venue and no photo of their own. */
export function wantsVenuePhoto(e: SceneEvent): boolean {
  return e.source === 'live' && !e.image && e.venue.trim().length > 2 && !/^(tba|tbd|online|virtual)\b/i.test(e.venue.trim())
}

function canAsk(): boolean {
  if (off || typeof window === 'undefined') return false
  if (!import.meta.env.PROD) return false
  try { if (window.top !== window.self) return false } catch { return false }
  return true
}

function readStore(): Record<string, { at: number; v: VenuePhoto | null }> {
  try { return JSON.parse(localStorage.getItem(STORE) ?? '{}') } catch { return {} }
}
function writeStore(key: string, v: VenuePhoto | null) {
  try {
    const all = readStore()
    const now = Date.now()
    for (const k of Object.keys(all)) if (now - all[k].at > DAY) delete all[k]
    all[key] = { at: now, v }
    localStorage.setItem(STORE, JSON.stringify(all))
  } catch { /* storage full or blocked: memory still works */ }
}

export function cachedVenuePhoto(e: SceneEvent): VenuePhoto | null | undefined {
  const key = venueKey(e)
  if (memory.has(key)) return memory.get(key)
  const hit = readStore()[key]
  if (hit && Date.now() - hit.at < DAY) { memory.set(key, hit.v); return hit.v }
  return undefined
}

export function fetchVenuePhoto(e: SceneEvent, fetcher: typeof fetch = fetch): Promise<VenuePhoto | null> {
  const key = venueKey(e)
  const known = cachedVenuePhoto(e)
  if (known !== undefined) return Promise.resolve(known)
  if (!canAsk()) return Promise.resolve(null)
  let p = pending.get(key)
  if (!p) {
    const params = new URLSearchParams({ q: e.venue, near: e.town })
    p = fetcher(`${import.meta.env.BASE_URL}api/place-photo?${params}`)
      .then(async (res) => {
        if (res.status === 503 || res.status === 404) { off = true; return null }
        if (!res.ok) return null
        const body = (await res.json()) as { url?: string | null; credit?: VenuePhoto['credit'] }
        const v = body.url && /^https:\/\//.test(body.url) ? { url: body.url, credit: body.credit ?? [] } : null
        memory.set(key, v)
        writeStore(key, v)
        return v
      })
      .catch(() => null)
      .finally(() => pending.delete(key))
    pending.set(key, p)
  }
  return p
}

/** The venue photo for an event once `active` (e.g. the card is on screen). */
export function useVenuePhoto(e: SceneEvent, active = true): VenuePhoto | null {
  const want = wantsVenuePhoto(e)
  const [photo, setPhoto] = useState<VenuePhoto | null>(() => (want ? cachedVenuePhoto(e) ?? null : null))
  useEffect(() => {
    if (!want || !active) return
    let live = true
    fetchVenuePhoto(e).then((v) => { if (live) setPhoto(v) })
    return () => { live = false }
  }, [want, active, e])
  return want ? photo : null
}

/** "Photo: Sam Lee" for screen text; Google Maps is shown beside it. */
export function creditLine(p: VenuePhoto): string {
  const names = p.credit.map((c) => c.name).slice(0, 2)
  return names.length ? `Photo: ${names.join(', ')}` : 'Photo'
}
