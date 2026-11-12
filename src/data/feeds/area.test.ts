import { describe, expect, it } from 'vitest'
import { REGION_HUBS, searchEach } from './area'

describe('searchEach', () => {
  it('runs every city at once, merges, and survives one failing', async () => {
    const t0 = Date.now()
    const out = await searchEach(REGION_HUBS.slice(0, 3), async (a) => {
      await new Promise((r) => setTimeout(r, 100))
      if (a.name.startsWith('Asheville')) throw new Error('down')
      return [{ id: 'same' }, { id: a.name }]
    }, 10)
    expect(Date.now() - t0).toBeLessThan(250)
    expect(out.map((e) => e.id)).toEqual(['same', 'Greenville, SC', 'Charlotte, NC'])
  })

  it('reports a missing key', async () => {
    await expect(searchEach(REGION_HUBS.slice(0, 2), async () => { throw new Error('needs-key') }, 0)).rejects.toThrow('needs-key')
  })
})
