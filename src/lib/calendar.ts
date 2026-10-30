/** Calendar helpers. All dates are local; weeks start on Sunday (US). */

export type CalendarMode = 'day' | 'week' | 'month'

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function startOfWeek(d: Date): Date {
  return addDays(startOfDay(d), -d.getDay())
}

/** The 7 days (Sun–Sat) of the week containing `d`. */
export function weekDays(d: Date): Date[] {
  const start = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/**
 * Six full weeks covering the month of `d`, so the grid never changes height.
 * Days outside the month are included for context.
 */
export function monthGrid(d: Date): Date[] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export function addMonths(d: Date, n: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay))
}

/** Local "YYYY-MM-DD" key for grouping. */
export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatWeekRange(days: Date[], locale?: string): string {
  const a = days[0]
  const b = days[days.length - 1]
  const sameMonth = a.getMonth() === b.getMonth()
  const left = a.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  const right = b.toLocaleDateString(locale, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${left} – ${right}`
}
