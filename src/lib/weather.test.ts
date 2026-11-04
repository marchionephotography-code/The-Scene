import { describe, expect, it } from 'vitest'
import type { Recommendation } from './discovery'
import { applyWeather, parseForecast } from './weather'
import { buildSampleEvents } from '../data/sampleEvents'

describe('weather', () => {
  it('parses the Open-Meteo daily forecast', () => {
    const f = parseForecast({
      daily: { time: ['2026-11-07'], weather_code: [63], temperature_2m_max: [71.6], temperature_2m_min: [50.2], precipitation_probability_max: [80] },
    })
    expect(f['2026-11-07']).toEqual({ rainPct: 80, highF: 72, lowF: 50, code: 63 })
  })

  it('moves outdoor events below indoor ones on a rainy day', () => {
    const now = new Date(2026, 10, 4, 12)
    const sat = buildSampleEvents(now)
      .filter((e) => new Date(e.start).getDay() === 6)
      .sort((a, b) => a.start.localeCompare(b.start))
    const recs: Recommendation[] = sat.map((event) => ({ event, miles: null, reasons: [] }))
    const d = new Date(sat[0].start)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const out = applyWeather(recs, { [key]: { rainPct: 90, highF: 60, lowF: 50, code: 63 } })
    const outdoor = (r: Recommendation) => r.event.category === 'outdoors' || r.event.tags.includes('outdoors')
    const firstOutdoor = out.findIndex(outdoor)
    expect(out.slice(firstOutdoor).every(outdoor)).toBe(true)
    expect(out.filter(outdoor).every((r) => r.reasons.includes('rain likely'))).toBe(true)
  })
})
