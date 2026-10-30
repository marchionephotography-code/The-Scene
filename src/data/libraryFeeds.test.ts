import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLibrary, LIBRARY_FEEDS, plainText, toSceneEvent, type TribeEvent } from './libraryFeeds'

const feed = LIBRARY_FEEDS[0]

const storyTime: TribeEvent = {
  id: 101,
  title: 'Toddler Story Time &amp; Songs',
  description: '<p>Stories, songs &#8211; and bubbles for ages 1&ndash;4.</p>',
  url: 'https://example.org/event/story-time',
  start_date: '2026-11-03 10:30:00',
  end_date: '2026-11-03 11:15:00',
  cost: '',
  venue: { venue: 'Main Library', city: 'Anderson', state: 'SC', geo_lat: '34.5', geo_lng: '-82.65' },
  categories: [{ name: 'Children' }],
}

describe('library feed parsing', () => {
  it('turns a calendar event into a live, kid-friendly library event', () => {
    const e = toSceneEvent(storyTime, feed)
    expect(e.title).toBe('Toddler Story Time & Songs')
    expect(e.description).toContain('Stories, songs – and bubbles')
    expect(e.source).toBe('live')
    expect(e.host).toEqual({ name: 'Anderson County Library', kind: 'library' })
    expect(e.category).toBe('family')
    expect(e.age).toBe('family')
    expect(e.tags).toContain('family')
    expect(e.town).toBe('Anderson, SC')
    expect(e.location).toEqual({ lat: 34.5, lng: -82.65 })
    expect(new Date(e.start)).toEqual(new Date(2026, 10, 3, 10, 30))
    expect(e.price).toEqual({ min: null, max: null, status: 'confirmed' })
  })

  it('handles missing venue, paid events, and adult programs', () => {
    const e = toSceneEvent({ id: 7, title: 'Adults Only Watercolor Night', start_date: '2026-11-05 18:00:00', cost: '$5', venue: [] }, feed)
    expect(e.location).toEqual({ lat: feed.fallback.lat, lng: feed.fallback.lng })
    expect(e.price.min).toEqual({ amountCents: 500, currency: 'USD' })
    expect(e.age).toBe('18+')
    expect(e.category).toBe('arts')
  })

  it('strips tags and entities', () => {
    expect(plainText('<b>Hi</b>&nbsp;&amp; bye')).toBe('Hi & bye')
  })
})

describe('fetchLibrary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports a library as unavailable instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('blocked')))
    const r = await fetchLibrary(feed, new Date(2026, 10, 1))
    expect(r.status).toBe('unavailable')
    expect(r.events).toEqual([])
  })

  it('maps events from a working feed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [storyTime] }) }))
    const r = await fetchLibrary(feed, new Date(2026, 10, 1))
    expect(r.status).toBe('ok')
    expect(r.events).toHaveLength(1)
  })
})
