/**
 * The person's taste profile: what they're into, what they'd rather skip,
 * and how they like to go out. Used to rank and filter events everywhere.
 * Pure functions only, so the ranking can be tested.
 */
import type { Category, GeoPoint, SceneEvent } from '../types/event'
import type { Recommendation } from './discovery'
import { distanceMiles } from './discovery'

export type InterestId =
  | 'live-music' | 'comedy' | 'theater' | 'sports' | 'art' | 'food' | 'drinks' | 'trivia'
  | 'outdoors' | 'markets' | 'family' | 'classes' | 'nightlife' | 'film' | 'chill' | 'active'

export interface Interest {
  id: InterestId
  label: string
  /** Matches if the event's category is listed… */
  categories?: Category[]
  /** …or it carries one of these tags… */
  tags?: string[]
  /** …or its title/description matches. */
  words?: RegExp
}

export const INTERESTS: Interest[] = [
  { id: 'live-music', label: 'Live music', categories: ['music'], tags: ['live music'] },
  { id: 'comedy', label: 'Comedy', tags: ['funny'], words: /comed|improv|stand-?up/i },
  { id: 'theater', label: 'Theater', categories: ['shows'], words: /theat|play|musical|broadway/i },
  { id: 'sports', label: 'Sports', categories: ['sports'] },
  { id: 'art', label: 'Art & galleries', categories: ['arts'], words: /gallery|exhibit|studio/i },
  { id: 'food', label: 'Food', categories: ['food'], words: /food|brunch|dinner|tasting/i },
  { id: 'drinks', label: 'Breweries & bars', words: /brew|beer|wine|cocktail|taproom|\bbar\b|pub/i },
  { id: 'trivia', label: 'Trivia & games', tags: ['competitive'], words: /trivia|game night|bingo|board game/i },
  { id: 'outdoors', label: 'Outdoors', categories: ['outdoors'], tags: ['outdoors'] },
  { id: 'markets', label: 'Markets & festivals', words: /market|festival|fair\b|vendors/i },
  { id: 'family', label: 'Kid-friendly', categories: ['family'], tags: ['family'] },
  { id: 'classes', label: 'Classes & workshops', tags: ['hands-on', 'creative'], words: /class|workshop|drop-in|lesson/i },
  { id: 'nightlife', label: 'Late nights', tags: ['late night', 'lively'], words: /\bdj\b|dance|club|late show/i },
  { id: 'film', label: 'Movies', words: /film|movie|screening|matinee/i },
  { id: 'chill', label: 'Low-key & chill', tags: ['chill'] },
  { id: 'active', label: 'Active & sporty', tags: ['active'], words: /hike|paddle|run\b|ride|yoga|climb/i },
]

export type Budget = 'free' | 'under-20' | 'under-50' | 'any'
export type GoesOut = 'weeknights' | 'weekends' | 'daytime' | 'late'
export type Company = 'solo' | 'date' | 'friends' | 'kids'
export type Need = 'accessible' | 'alcohol-free' | 'dog-friendly' | 'all-ages'

export interface Profile {
  /** Set once the person finishes or skips setup. */
  onboarded: boolean
  name: string
  home: { label: string; point: GeoPoint } | null
  /** How far they'll usually travel, in miles. */
  travelMiles: number
  likes: InterestId[]
  skips: InterestId[]
  budget: Budget
  goesOut: GoesOut[]
  company: Company[]
  needs: Need[]
  /** Event ids marked "Not for me". */
  hiddenEvents: string[]
  /** Event ids marked "More like this" (their interests get a boost). */
  moreLike: string[]
}

export const EMPTY_PROFILE: Profile = {
  onboarded: false,
  name: '',
  home: null,
  travelMiles: 50,
  likes: [],
  skips: [],
  budget: 'any',
  goesOut: [],
  company: [],
  needs: [],
  hiddenEvents: [],
  moreLike: [],
}

export const BUDGET_LABELS: Record<Budget, string> = { free: 'Free only', 'under-20': 'Under $20', 'under-50': 'Under $50', any: 'Any budget' }
export const GOES_OUT_LABELS: Record<GoesOut, string> = { weeknights: 'Weeknights', weekends: 'Weekends', daytime: 'Daytime', late: 'Late nights' }
export const COMPANY_LABELS: Record<Company, string> = { solo: 'On my own', date: 'On dates', friends: 'With friends', kids: 'With kids' }
export const NEED_LABELS: Record<Need, string> = { accessible: 'Step-free access', 'alcohol-free': 'Alcohol-free options', 'dog-friendly': 'Dog-friendly', 'all-ages': 'All-ages only' }
export const TRAVEL_OPTIONS = [10, 25, 50, 100] as const

export function interestsFor(e: SceneEvent): InterestId[] {
  const text = `${e.title} ${e.venue} ${e.description}`
  return INTERESTS.filter(
    (i) =>
      (i.categories?.includes(e.category) ?? false) ||
      (i.tags?.some((t) => e.tags.includes(t)) ?? false) ||
      (i.words?.test(text) ?? false),
  ).map((i) => i.id)
}

const label = (id: InterestId) => INTERESTS.find((i) => i.id === id)!.label.toLowerCase()

function priceCents(e: SceneEvent): number | null {
  if (e.price.min === null) return e.price.status === 'missing' ? null : 0
  return e.price.min.amountCents
}

function fitsBudget(e: SceneEvent, b: Budget): boolean {
  const c = priceCents(e)
  if (c === null || b === 'any') return true
  return b === 'free' ? c === 0 : c <= (b === 'under-20' ? 2000 : 5000)
}

function timeFits(e: SceneEvent, goesOut: GoesOut[]): boolean {
  if (!goesOut.length) return false
  const d = new Date(e.start)
  const h = d.getHours()
  const weekend = d.getDay() === 0 || d.getDay() === 6 || (d.getDay() === 5 && h >= 17)
  return goesOut.some((g) =>
    g === 'weekends' ? weekend : g === 'weeknights' ? !weekend && h >= 17 : g === 'daytime' ? h < 17 : h >= 21,
  )
}

export interface Personalized {
  recs: Recommendation[]
  /** How many events were hidden by skips or "Not for me". */
  hiddenCount: number
}

/**
 * Ranks events for this person. Skipped interests and "Not for me" events
 * are hidden (unless `showHidden`); liked interests, budget, timing, and
 * travel distance raise an event. Ties keep the incoming order (by date).
 * The first liked interest becomes a "you like …" reason on the card.
 */
export function personalize(recs: Recommendation[], p: Profile, all: SceneEvent[] = [], showHidden = false): Personalized {
  const boosted = new Set<InterestId>(p.likes)
  for (const id of p.moreLike) {
    const e = all.find((x) => x.id === id)
    if (e) interestsFor(e).forEach((i) => boosted.add(i))
  }
  let hiddenCount = 0
  const scored: { r: Recommendation; score: number; i: number }[] = []
  recs.forEach((r, i) => {
    const e = r.event
    const ints = interestsFor(e)
    const skipped = p.hiddenEvents.includes(e.id) || ints.some((x) => p.skips.includes(x))
    const blockedByNeed = p.needs.includes('all-ages') && (e.age === '18+' || e.age === '21+')
    if ((skipped || blockedByNeed) && !showHidden) {
      hiddenCount++
      return
    }
    const liked = p.likes.filter((x) => ints.includes(x))
    let score = 0
    score += liked.length ? 3 : 0
    score += ints.some((x) => boosted.has(x) && !p.likes.includes(x)) ? 1 : 0
    score += fitsBudget(e, p.budget) ? 0 : -3
    score += timeFits(e, p.goesOut) ? 1 : 0
    if (p.home) score += distanceMiles(p.home.point, e.location) <= p.travelMiles ? 0 : -2
    if (p.company.includes('kids') && (e.age === 'family' || e.category === 'family')) score += 1
    if (p.company.includes('date') && e.tags.includes('date night')) score += 1
    const reasons = liked.length ? [...r.reasons, `you like ${label(liked[0])}`] : r.reasons
    scored.push({ r: { ...r, reasons }, score, i })
  })
  scored.sort((a, b) => b.score - a.score || a.i - b.i)
  return { recs: scored.map((s) => s.r), hiddenCount }
}

/** Short summary for the You tab, e.g. "Into live music, comedy, and 3 more". */
export function likesSummary(p: Profile): string {
  if (!p.likes.length) return 'No interests picked yet'
  const names = p.likes.map(label)
  return names.length <= 3 ? `Into ${names.join(', ')}` : `Into ${names.slice(0, 2).join(', ')}, and ${names.length - 2} more`
}
