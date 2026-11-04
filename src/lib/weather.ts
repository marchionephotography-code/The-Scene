/**
 * Daily forecast from Open-Meteo (free, no key). Used to push outdoor events
 * down on rainy days and to show the weather on outdoor event cards.
 */
import type { GeoPoint, SceneEvent } from '../types/event'
import type { Recommendation } from './discovery'

export interface DayForecast {
  /** Chance of rain at its highest that day, 0–100. */
  rainPct: number
  highF: number
  lowF: number
  /** WMO weather code. */
  code: number
}

/** "YYYY-MM-DD" in the viewer's local time. */
export type Forecast = Record<string, DayForecast>

/** Rain this likely moves outdoor events down the list. */
export const RAINY = 60

export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isOutdoor(e: SceneEvent): boolean {
  return e.category === 'outdoors' || e.tags.includes('outdoors')
}

interface OpenMeteoDaily {
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: (number | null)[]
  }
}

export function parseForecast(json: OpenMeteoDaily): Forecast {
  const d = json.daily
  if (!d?.time?.length) throw new Error('no forecast')
  const out: Forecast = {}
  d.time.forEach((t, i) => {
    out[t] = {
      rainPct: d.precipitation_probability_max[i] ?? 0,
      highF: Math.round(d.temperature_2m_max[i]),
      lowF: Math.round(d.temperature_2m_min[i]),
      code: d.weather_code[i],
    }
  })
  return out
}

export async function fetchForecast(at: GeoPoint, signal?: AbortSignal): Promise<Forecast> {
  const p = new URLSearchParams({
    latitude: at.lat.toFixed(3),
    longitude: at.lng.toFixed(3),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    forecast_days: '14',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { signal })
  if (!res.ok) throw new Error(`forecast ${res.status}`)
  return parseForecast(await res.json())
}

export function forecastFor(e: SceneEvent, f: Forecast | null): DayForecast | null {
  return f?.[dayKey(new Date(e.start))] ?? null
}

/** Short words for a WMO code. */
export function describe(code: number): string {
  if (code === 0) return 'Sunny'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67 || (code >= 80 && code <= 82)) return 'Rain'
  if (code <= 77 || code === 85 || code === 86) return 'Snow'
  return 'Storms'
}

/**
 * Outdoor events on rainy days sink below everything else on that day's
 * list (order is otherwise kept), and get a "rain likely" reason. Indoor
 * events on those days get an "indoors" reason.
 */
export function applyWeather(recs: Recommendation[], f: Forecast | null): Recommendation[] {
  if (!f) return recs
  const wet = (r: Recommendation) => {
    const day = forecastFor(r.event, f)
    return day !== null && day.rainPct >= RAINY
  }
  const tagged = recs.map((r) => {
    if (!wet(r)) return r
    const reason = isOutdoor(r.event) ? 'rain likely' : 'indoors on a rainy day'
    return { ...r, reasons: [...r.reasons, reason] }
  })
  const rank = (r: Recommendation) => (wet(r) && isOutdoor(r.event) ? 1 : 0)
  // Stable: group by day, then push rained-out events to the end of their day.
  return tagged
    .map((r, i) => ({ r, i, day: dayKey(new Date(r.event.start)) }))
    .sort((a, b) => (a.day === b.day ? rank(a.r) - rank(b.r) || a.i - b.i : a.i - b.i))
    .map((x) => x.r)
}
