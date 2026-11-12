import { afterEach, describe, expect, it, vi } from 'vitest'

const env: Record<string, string | undefined> = { TICKETMASTER_KEY: 'secret' }
;(globalThis as unknown as { Netlify: unknown }).Netlify = { env: { get: (k: string) => env[k] } }
const { default: handler } = await import('./ticketmaster.mts')

afterEach(() => vi.restoreAllMocks())

describe('ticketmaster function', () => {
  it('searches with the server key, rounds the location, and caches', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ _embedded: { events: [] } })))
    const res = await handler(new Request('https://x/api/ticketmaster?lat=34.50341&lng=-82.65012&radius=60&size=40'))
    expect(res.status).toBe(200)
    const url = String(f.mock.calls[0][0])
    expect(url).toContain('apikey=secret')
    expect(url).toContain('latlong=34.50%2C-82.65')
    expect(res.headers.get('netlify-cdn-cache-control')).toContain('s-maxage=900')
  })
  it('rejects bad input without calling Ticketmaster', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
    expect((await handler(new Request('https://x/api/ticketmaster?lat=abc&lng=1'))).status).toBe(400)
    expect((await handler(new Request('https://x/api/ticketmaster?id=../../etc'))).status).toBe(400)
    expect(f).not.toHaveBeenCalled()
  })
  it('says when the key is missing', async () => {
    env.TICKETMASTER_KEY = undefined
    expect((await handler(new Request('https://x/api/ticketmaster?lat=1&lng=1'))).status).toBe(503)
    env.TICKETMASTER_KEY = 'secret'
  })
})
