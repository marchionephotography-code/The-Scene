import { afterEach, describe, expect, it, vi } from 'vitest'

const env: Record<string, string | undefined> = { GOOGLE_PLACES_KEY: 'secret' }
;(globalThis as unknown as { Netlify: unknown }).Netlify = { env: { get: (k: string) => env[k] } }
const { default: handler } = await import('./place-photo.mts')

afterEach(() => vi.restoreAllMocks())

describe('place-photo function', () => {
  it('finds the venue, returns the photo and its credit, and caches for a day', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ places: [{ photos: [{ name: 'places/abc/photos/xyz', authorAttributions: [{ displayName: 'Sam Lee', uri: 'https://maps.google.com/maps/contrib/1' }] }] }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ photoUri: 'https://lh3.googleusercontent.com/p/abc' })))
    const res = await handler(new Request('https://x/api/place-photo?q=Copper%20Kettle%20Taproom&near=Clemson%2C%20SC'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://lh3.googleusercontent.com/p/abc', credit: [{ name: 'Sam Lee', uri: 'https://maps.google.com/maps/contrib/1' }] })
    const [searchUrl, init] = f.mock.calls[0] as [string, RequestInit]
    expect(searchUrl).toContain('places:searchText')
    expect((init.headers as Record<string, string>)['X-Goog-Api-Key']).toBe('secret')
    expect(JSON.parse(String(init.body)).textQuery).toBe('Copper Kettle Taproom, Clemson, SC')
    expect(res.headers.get('netlify-cdn-cache-control')).toContain('s-maxage=86400')
    // The key never goes back to the browser.
    expect(JSON.stringify(await (await handler(new Request('https://x/api/place-photo?q=a'))).json())).not.toContain('secret')
  })
  it('answers with no photo when Google has none', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ places: [{}] })))
    expect(await (await handler(new Request('https://x/api/place-photo?q=Somewhere'))).json()).toEqual({ url: null })
  })
  it('rejects empty input and says when the key is missing', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
    expect((await handler(new Request('https://x/api/place-photo?q='))).status).toBe(400)
    env.GOOGLE_PLACES_KEY = undefined
    expect((await handler(new Request('https://x/api/place-photo?q=Venue'))).status).toBe(503)
    env.GOOGLE_PLACES_KEY = 'secret'
    expect(f).not.toHaveBeenCalled()
  })
})
