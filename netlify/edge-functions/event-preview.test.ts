import { afterEach, describe, expect, it, vi } from 'vitest'

;(globalThis as unknown as { Netlify: unknown }).Netlify = { env: { get: () => 'secret' } }
const { default: handler } = await import('./event-preview.ts')

const shell = '<html><head><title>The Scene</title><meta property="og:title" content="The Scene" /><meta property="og:description" content="x" /><meta property="og:image" content="/og-image.png" /></head></html>'
const ctx = { next: async () => new Response(shell, { headers: { 'content-type': 'text/html' } }) }

afterEach(() => vi.restoreAllMocks())

describe('event link previews', () => {
  it('fills in a Ticketmaster event', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      name: 'Zeta <Folk> Revue', dates: { start: { localDate: '2026-11-20', localTime: '20:00:00' } },
      images: [{ url: 'https://img/small.jpg', width: 640, ratio: '16_9' }, { url: 'https://img/big.jpg', width: 1024, ratio: '16_9' }],
      _embedded: { venues: [{ name: 'Peace Center', city: { name: 'Greenville' }, state: { stateCode: 'SC' } }] },
    })))
    const html = await (await handler(new Request('https://s/e/tm-ABC123'), ctx)).text()
    expect(html).toContain('og:title" content="Zeta &lt;Folk&gt; Revue"')
    expect(html).toContain('Peace Center · Greenville, SC')
    expect(html).toContain('og:image" content="https://img/big.jpg"')
    expect(html).toContain('<title>Zeta &lt;Folk&gt; Revue · The Scene</title>')
  })
  it('leaves other events with the general preview', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
    const html = await (await handler(new Request('https://s/e/sample-3'), ctx)).text()
    expect(html).toBe(shell)
    expect(f).not.toHaveBeenCalled()
  })
})
