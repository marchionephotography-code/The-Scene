/**
 * SAMPLE DATA — not real events.
 *
 * Every event here is invented for demo purposes. Venues are fictional, and
 * prices are made up. Each item is tagged `source: "sample"` and its price
 * status is "sample". Swap this file out for a real event source in
 * `eventSource.ts`; nothing else should import it directly.
 *
 * Dates are generated relative to "now" so the date shortcuts (Tonight,
 * Tomorrow, This Weekend) always have something to show.
 */
import type { Category, SceneEvent, AgeSuitability } from '../types/event'

/** Manual-pick locations, also used as the fallback when location is denied. */
export const SAMPLE_TOWNS = [
  { name: 'Clemson, SC', lat: 34.6834, lng: -82.8374 },
  { name: 'Greenville, SC', lat: 34.8526, lng: -82.394 },
  { name: 'Anderson, SC', lat: 34.5034, lng: -82.6501 },
  { name: 'Seneca, SC', lat: 34.6857, lng: -82.9532 },
] as const

interface Seed {
  title: string
  category: Category
  tags: string[]
  venue: string
  town: string
  lat: number
  lng: number
  /** Days from today; 0 = today. Negative values count back from the coming Saturday ("sat"). */
  day: number | 'sat' | 'sun' | 'fri'
  hour: number
  minute?: number
  durationHours: number
  priceMin: number | null // whole dollars, null = free
  priceMax?: number
  age: AgeSuitability
  local: boolean
  description: string
  /** Host library name, for sample library events. */
  library?: string
}

const SEEDS: Seed[] = [
  // Sample public-library events (fictional branches, invented programs)
  { title: 'Toddler Story Time & Bubbles', category: 'family', tags: ['family', 'chill', 'indoors'], venue: 'Lakeside Branch Library (sample)', town: 'Anderson, SC', lat: 34.5101, lng: -82.6422, day: 1, hour: 10, minute: 30, durationHours: 0.75, priceMin: null, age: 'family', local: true, description: 'Songs, two picture books, and a bubble finale. Best for ages 1–4 with a grown-up.', library: 'Lakeside Branch Library (sample)' },
  { title: 'LEGO Build Club', category: 'family', tags: ['family', 'creative', 'hands-on', 'indoors'], venue: 'Lakeside Branch Library (sample)', town: 'Anderson, SC', lat: 34.5101, lng: -82.6422, day: 'sat', hour: 14, durationHours: 1.5, priceMin: null, age: 'family', local: true, description: 'A new build challenge every week. Bricks provided; ages 6–12.', library: 'Lakeside Branch Library (sample)' },
  { title: 'STEM Saturday: Paper Rockets', category: 'family', tags: ['family', 'hands-on', 'active'], venue: 'Hillcrest Library (sample)', town: 'Seneca, SC', lat: 34.6889, lng: -82.9601, day: 'sat', hour: 11, durationHours: 1.5, priceMin: null, age: 'family', local: true, description: 'Design, build, and launch your own paper rocket on the library lawn.', library: 'Hillcrest Library (sample)' },
  { title: 'Family Movie Matinee', category: 'family', tags: ['family', 'chill', 'indoors'], venue: 'Main Street Library (sample)', town: 'Clemson, SC', lat: 34.6842, lng: -82.8352, day: 'sun', hour: 14, durationHours: 2, priceMin: null, age: 'family', local: true, description: 'A family-favorite movie on the big screen. Bring a blanket; popcorn provided.', library: 'Main Street Library (sample)' },
  { title: 'Teen Game Night', category: 'family', tags: ['social', 'competitive', 'indoors'], venue: 'Hillcrest Library (sample)', town: 'Seneca, SC', lat: 34.6889, lng: -82.9601, day: 2, hour: 17, durationHours: 2, priceMin: null, age: 'all-ages', local: true, description: 'Board games, video games, and snacks for ages 12–18.', library: 'Hillcrest Library (sample)' },

  { title: 'Porch Light Bluegrass Jam', category: 'music', tags: ['chill', 'live music', 'outdoors'], venue: 'Mill Yard Stage (sample)', town: 'Pendleton, SC', lat: 34.6512, lng: -82.7838, day: 0, hour: 19, durationHours: 3, priceMin: null, age: 'all-ages', local: true, description: 'Open jam on the porch. Bring a chair or an instrument.' },
  { title: 'Trivia Night: 90s Edition', category: 'food', tags: ['social', 'lively', 'competitive'], venue: 'Copper Kettle Taproom (sample)', town: 'Clemson, SC', lat: 34.6851, lng: -82.8361, day: 0, hour: 20, durationHours: 2, priceMin: null, age: '21+', local: true, description: 'Teams up to 6. Food and drink specials during the game.' },
  { title: 'Indie Rock Showcase', category: 'music', tags: ['lively', 'live music', 'late night'], venue: 'The Brickhouse (sample)', town: 'Greenville, SC', lat: 34.8507, lng: -82.3989, day: 0, hour: 21, durationHours: 3, priceMin: 12, priceMax: 15, age: '18+', local: true, description: 'Three local bands on one bill.' },
  { title: 'Community Theater: A Comedy of Errors', category: 'shows', tags: ['funny', 'date night'], venue: 'Lakeside Little Theatre (sample)', town: 'Seneca, SC', lat: 34.6852, lng: -82.9531, day: 1, hour: 19, minute: 30, durationHours: 2.5, priceMin: 18, priceMax: 22, age: 'family', local: true, description: 'A fast, family-friendly take on Shakespeare.' },
  { title: 'Minor League Baseball Doubleheader', category: 'sports', tags: ['lively', 'family', 'outdoors'], venue: 'Riverside Ballpark (sample)', town: 'Greenville, SC', lat: 34.8434, lng: -82.4061, day: 1, hour: 16, durationHours: 5, priceMin: 9, priceMax: 24, age: 'family', local: false, description: 'Two games for one ticket. Fireworks after game two.' },
  { title: 'Sunset Kayak Paddle', category: 'outdoors', tags: ['chill', 'active', 'outdoors'], venue: 'Lake Hartwell Landing (sample)', town: 'Anderson, SC', lat: 34.5612, lng: -82.8015, day: 1, hour: 17, minute: 30, durationHours: 2, priceMin: 35, age: 'all-ages', local: true, description: 'Guided paddle. Kayaks and life vests provided.' },
  { title: 'Food Truck Friday', category: 'food', tags: ['social', 'family', 'outdoors'], venue: 'Town Green (sample)', town: 'Easley, SC', lat: 34.8298, lng: -82.6015, day: 'fri', hour: 17, durationHours: 4, priceMin: null, age: 'family', local: true, description: 'A dozen trucks, lawn games, and a DJ. Free to attend; food sold separately.' },
  { title: 'Gallery Walk & Open Studios', category: 'arts', tags: ['chill', 'creative', 'date night'], venue: 'West End Arts District (sample)', town: 'Greenville, SC', lat: 34.8442, lng: -82.4049, day: 'fri', hour: 18, durationHours: 3, priceMin: null, age: 'all-ages', local: true, description: 'Studios open their doors. Meet the artists.' },
  { title: 'Saturday Farmers Market', category: 'food', tags: ['chill', 'family', 'outdoors'], venue: 'Depot Square (sample)', town: 'Clemson, SC', lat: 34.6869, lng: -82.8306, day: 'sat', hour: 8, durationHours: 4, priceMin: null, age: 'family', local: true, description: 'Local produce, baked goods, and coffee.' },
  { title: 'Kids Science Saturday', category: 'family', tags: ['family', 'hands-on', 'indoors'], venue: 'Discovery Hall (sample)', town: 'Anderson, SC', lat: 34.5021, lng: -82.6512, day: 'sat', hour: 10, durationHours: 3, priceMin: 6, priceMax: 10, age: 'family', local: true, description: 'Slime, rockets, and a planetarium show. Kids $6, adults $10.' },
  { title: 'Waterfall Hike: Guided Group', category: 'outdoors', tags: ['active', 'outdoors', 'chill'], venue: 'Blue Ridge Trailhead (sample)', town: 'Walhalla, SC', lat: 34.7651, lng: -83.0638, day: 'sat', hour: 9, durationHours: 4, priceMin: null, age: 'all-ages', local: true, description: 'Moderate 4-mile loop with a ranger. Free; a park entry fee may apply.' },
  { title: 'College Volleyball', category: 'sports', tags: ['lively', 'competitive'], venue: 'Campus Arena (sample)', town: 'Clemson, SC', lat: 34.6782, lng: -82.8432, day: 'sat', hour: 13, durationHours: 2.5, priceMin: 5, age: 'all-ages', local: false, description: 'Conference matchup. Student section gets loud.' },
  { title: 'Jazz on the Lawn', category: 'music', tags: ['chill', 'live music', 'date night', 'outdoors'], venue: 'Amphitheater Commons (sample)', town: 'Anderson, SC', lat: 34.5042, lng: -82.6488, day: 'sat', hour: 19, durationHours: 3, priceMin: 15, age: 'all-ages', local: true, description: 'Bring a blanket. Wine and snacks for sale.' },
  { title: 'Improv Comedy Late Show', category: 'shows', tags: ['funny', 'late night', 'social'], venue: 'The Back Room (sample)', town: 'Greenville, SC', lat: 34.8519, lng: -82.3998, day: 'sat', hour: 22, durationHours: 1.5, priceMin: 10, age: '18+', local: true, description: 'Fully made up on the spot. Audience suggestions welcome.' },
  { title: 'Pottery Wheel Drop-In', category: 'arts', tags: ['creative', 'hands-on', 'date night', 'indoors'], venue: 'Clay Collective (sample)', town: 'Pendleton, SC', lat: 34.6507, lng: -82.7851, day: 'sun', hour: 14, durationHours: 2, priceMin: 40, age: 'all-ages', local: true, description: 'Beginner-friendly. Your piece is fired and ready in two weeks.' },
  { title: 'Sunday Bluegrass Brunch', category: 'food', tags: ['chill', 'live music', 'family'], venue: 'Old Mill Café (sample)', town: 'Seneca, SC', lat: 34.6871, lng: -82.9555, day: 'sun', hour: 11, durationHours: 2.5, priceMin: 14, priceMax: 22, age: 'family', local: true, description: 'Biscuits, gravy, and a three-piece band.' },
  { title: 'Family Movie Night in the Park', category: 'family', tags: ['family', 'chill', 'outdoors'], venue: 'Riverwalk Park (sample)', town: 'Clemson, SC', lat: 34.6801, lng: -82.8289, day: 'sun', hour: 18, minute: 30, durationHours: 2.5, priceMin: null, age: 'family', local: true, description: 'Animated feature on a big screen. Free popcorn while it lasts.' },
  { title: 'Symphony Pops Concert', category: 'music', tags: ['date night', 'live music'], venue: 'Downtown Concert Hall (sample)', town: 'Greenville, SC', lat: 34.8487, lng: -82.4001, day: 9, hour: 19, minute: 30, durationHours: 2, priceMin: 25, priceMax: 65, age: 'all-ages', local: false, description: 'Movie themes and Broadway favorites.' },
  { title: 'Craft Night: Hand-Lettered Signs', category: 'arts', tags: ['creative', 'social', 'indoors'], venue: 'Maker Loft (sample)', town: 'Anderson, SC', lat: 34.5048, lng: -82.6534, day: 5, hour: 18, minute: 30, durationHours: 2, priceMin: 30, age: '18+', local: true, description: 'All supplies included. Take home your sign.' },
]

/** Days from `now` to the next given weekday (0 = Sun … 6 = Sat). Today counts if it matches. */
function daysUntil(now: Date, weekday: number): number {
  return (weekday - now.getDay() + 7) % 7
}

function dollars(n: number) {
  return { amountCents: Math.round(n * 100), currency: 'USD' }
}

export function buildSampleEvents(now: Date = new Date()): SceneEvent[] {
  return SEEDS.map((s, i) => {
    const offset =
      s.day === 'fri' ? daysUntil(now, 5)
      : s.day === 'sat' ? daysUntil(now, 6)
      : s.day === 'sun' ? daysUntil(now, 6) + 1 - (now.getDay() === 0 ? 7 : 0)
      : s.day
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, s.hour, s.minute ?? 0)
    const end = new Date(start.getTime() + s.durationHours * 3600_000)
    return {
      id: `sample-${i + 1}`,
      title: s.title,
      category: s.category,
      tags: s.tags,
      venue: s.venue,
      town: s.town,
      location: { lat: s.lat, lng: s.lng },
      start: start.toISOString(),
      end: end.toISOString(),
      price: {
        min: s.priceMin === null ? null : dollars(s.priceMin),
        max: s.priceMax === undefined ? null : dollars(s.priceMax),
        status: 'sample',
      },
      age: s.age,
      local: s.local,
      description: s.description,
      source: 'sample',
      ...(s.library ? { host: { name: s.library, kind: 'library' as const } } : {}),
    }
  })
}
