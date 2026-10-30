import type { Category, GeoPoint, SceneEvent } from '../types/event'

// ---------- Moods: "What do you feel like doing?" ----------

export type MoodId = 'chill' | 'lively' | 'laugh' | 'creative' | 'active' | 'family' | 'date' | 'eat'

export interface Mood {
  id: MoodId
  /** Short tile label. */
  label: string
  /** Used in "Matches:" reasons, e.g. "family time". */
  reason: string
  /** An event matches if it has any of these tags or categories. */
  tags: string[]
  categories: Category[]
}

export const MOODS: Mood[] = [
  { id: 'chill', label: 'Chill', reason: 'something chill', tags: ['chill'], categories: [] },
  { id: 'lively', label: 'Night out', reason: 'night out', tags: ['lively', 'late night'], categories: [] },
  { id: 'laugh', label: 'Laugh', reason: 'a good laugh', tags: ['funny'], categories: [] },
  { id: 'creative', label: 'Create', reason: 'make something', tags: ['creative', 'hands-on'], categories: ['arts'] },
  { id: 'active', label: 'Get active', reason: 'get active', tags: ['active'], categories: ['outdoors'] },
  { id: 'family', label: 'Family', reason: 'family time', tags: ['family'], categories: ['family'] },
  { id: 'date', label: 'Date night', reason: 'date night', tags: ['date night'], categories: [] },
  { id: 'eat', label: 'Food & drink', reason: 'food & drink', tags: [], categories: ['food'] },
]

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'music', label: 'Live music' },
  { id: 'sports', label: 'Sports' },
  { id: 'shows', label: 'Theater & shows' },
  { id: 'arts', label: 'Arts' },
  { id: 'food', label: 'Food & drink' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'family', label: 'Family' },
]

export function moodMatches(event: SceneEvent, mood: Mood): boolean {
  return mood.categories.includes(event.category) || event.tags.some((t) => mood.tags.includes(t))
}

// ---------- Dates ----------

export type DateFilter =
  | { kind: 'any' }
  | { kind: 'tonight' }
  | { kind: 'tomorrow' }
  | { kind: 'weekend' }
  /** Inclusive local dates, "YYYY-MM-DD". */
  | { kind: 'custom'; from: string; to: string }

export const DATE_LABELS: Record<DateFilter['kind'], string> = {
  any: 'Any time',
  tonight: 'Tonight',
  tomorrow: 'Tomorrow',
  weekend: 'This weekend',
  custom: 'Pick dates',
}

function atLocal(base: Date, dayOffset: number, hour = 0, minute = 0) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, minute)
}

function parseLocalDate(s: string, dayOffset = 0): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d + dayOffset)
}

/** Returns the [start, end) window for a date filter, or null for "any". */
export function dateWindow(filter: DateFilter, now: Date): [Date, Date] | null {
  switch (filter.kind) {
    case 'any':
      return null
    case 'tonight':
      // From 4 PM today until 3 AM tomorrow.
      return [atLocal(now, 0, 16), atLocal(now, 1, 3)]
    case 'tomorrow':
      return [atLocal(now, 1), atLocal(now, 2)]
    case 'weekend': {
      const dow = now.getDay() // 0 Sun … 6 Sat
      if (dow === 0) return [atLocal(now, 0), atLocal(now, 1)]
      if (dow === 6) return [atLocal(now, 0), atLocal(now, 2)]
      const toFri = 5 - dow
      return [atLocal(now, toFri, 16), atLocal(now, toFri + 3)]
    }
    case 'custom':
      return [parseLocalDate(filter.from), parseLocalDate(filter.to, 1)]
  }
}

// ---------- Distance ----------

/** Great-circle distance in miles. */
export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// ---------- Filters ----------

export type PriceFilter = 'any' | 'free' | 'under20' | 'under50'
export type AgeFilter = 'any' | 'kids' | 'adults'

export const PRICE_LABELS: Record<PriceFilter, string> = {
  any: 'Any price',
  free: 'Free',
  under20: 'Under $20',
  under50: 'Under $50',
}

export const AGE_LABELS: Record<AgeFilter, string> = {
  any: 'Any age',
  kids: 'Good for kids',
  adults: 'Adults only',
}

export const DISTANCE_OPTIONS = [5, 10, 25, 50] as const

export interface Filters {
  query: string
  mood: MoodId | null
  categories: Category[]
  date: DateFilter
  /** null = any distance. */
  maxMiles: number | null
  price: PriceFilter
  age: AgeFilter
  /** Only events hosted by public libraries. */
  libraryOnly: boolean
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  mood: null,
  categories: [],
  date: { kind: 'any' },
  maxMiles: 25,
  price: 'any',
  age: 'any',
  libraryOnly: false,
}

function startingCents(e: SceneEvent): number {
  return e.price.min?.amountCents ?? 0
}

function priceOk(e: SceneEvent, p: PriceFilter): boolean {
  if (p === 'any') return true
  if (e.price.status === 'missing') return false
  const cents = startingCents(e)
  if (p === 'free') return cents === 0
  if (p === 'under20') return cents < 2000
  return cents < 5000
}

function ageOk(e: SceneEvent, a: AgeFilter): boolean {
  if (a === 'any') return true
  if (a === 'kids') return e.age === 'all-ages' || e.age === 'family'
  return e.age === '18+' || e.age === '21+'
}

export interface Recommendation {
  event: SceneEvent
  /** null when we don't know where the user is. */
  miles: number | null
  /** Short, human reasons this event showed up, e.g. "Under $20". */
  reasons: string[]
}

export function recommend(
  events: SceneEvent[],
  filters: Filters,
  now: Date,
  origin: GeoPoint | null,
): Recommendation[] {
  const window = dateWindow(filters.date, now)
  const mood = MOODS.find((m) => m.id === filters.mood) ?? null
  const q = filters.query.trim().toLowerCase()

  const results: Recommendation[] = []
  for (const event of events) {
    const start = new Date(event.start)
    const end = event.end ? new Date(event.end) : start
    if (end <= now) continue // already over
    if (window && (start >= window[1] || end <= window[0])) continue
    if (mood && !moodMatches(event, mood)) continue
    if (filters.categories.length && !filters.categories.includes(event.category)) continue
    if (!priceOk(event, filters.price)) continue
    if (!ageOk(event, filters.age)) continue
    if (filters.libraryOnly && event.host?.kind !== 'library') continue
    if (q && ![event.title, event.venue, event.town, event.description, ...event.tags].some((s) => s.toLowerCase().includes(q))) continue

    const miles = origin ? distanceMiles(origin, event.location) : null
    if (miles !== null && filters.maxMiles !== null && miles > filters.maxMiles) continue

    results.push({ event, miles, reasons: reasonsFor(event, filters, mood, miles) })
  }

  // Soonest first; local picks win ties within the same hour.
  return results.sort((a, b) => {
    const diff = new Date(a.event.start).getTime() - new Date(b.event.start).getTime()
    if (Math.abs(diff) >= 3600_000) return diff
    return Number(b.event.local) - Number(a.event.local) || diff
  })
}

function reasonsFor(e: SceneEvent, f: Filters, mood: Mood | null, miles: number | null): string[] {
  const r: string[] = []
  if (mood) r.push(mood.reason)
  if (f.categories.includes(e.category)) r.push(CATEGORIES.find((c) => c.id === e.category)!.label.toLowerCase())
  if (f.price !== 'any') r.push(startingCents(e) === 0 ? 'free' : PRICE_LABELS[f.price].toLowerCase())
  if (f.age === 'kids') r.push('good for kids')
  if (e.host?.kind === 'library') r.push('library event')
  if (miles !== null) r.push(`${formatMiles(miles)} away`)
  if (e.local) r.push('local pick')
  return r
}

export function formatMiles(miles: number): string {
  if (miles < 0.5) return 'under ½ mi'
  return `${miles < 10 ? miles.toFixed(1).replace(/\.0$/, '') : Math.round(miles)} mi`
}

/** Labels for the "active filters" chips. Mood and query are shown elsewhere. */
export function activeFilterCount(f: Filters): number {
  let n = 0
  if (f.mood) n++
  if (f.query.trim()) n++
  n += f.categories.length
  if (f.date.kind !== 'any') n++
  if (f.maxMiles !== DEFAULT_FILTERS.maxMiles) n++
  if (f.price !== 'any') n++
  if (f.age !== 'any') n++
  if (f.libraryOnly) n++
  return n
}
