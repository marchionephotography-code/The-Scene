import { describe, expect, it } from 'vitest'
import { addMonths, dayKey, formatWeekRange, monthGrid, sameDay, startOfWeek, weekDays } from './calendar'

describe('calendar', () => {
  const fri = new Date(2026, 9, 30, 15, 20) // Fri Oct 30 2026

  it('weeks start on Sunday', () => {
    expect(startOfWeek(fri)).toEqual(new Date(2026, 9, 25))
    const days = weekDays(fri)
    expect(days).toHaveLength(7)
    expect(days[0].getDay()).toBe(0)
    expect(days[6]).toEqual(new Date(2026, 9, 31))
  })

  it('month grid is always 6 full weeks starting on Sunday and covers the month', () => {
    const grid = monthGrid(fri)
    expect(grid).toHaveLength(42)
    expect(grid[0].getDay()).toBe(0)
    expect(grid.some((d) => sameDay(d, new Date(2026, 9, 1)))).toBe(true)
    expect(grid.some((d) => sameDay(d, new Date(2026, 9, 31)))).toBe(true)
  })

  it('adding a month clamps to the last day', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28))
    expect(addMonths(new Date(2026, 9, 30), -1)).toEqual(new Date(2026, 8, 30))
  })

  it('day keys and week ranges', () => {
    expect(dayKey(fri)).toBe('2026-10-30')
    expect(formatWeekRange(weekDays(fri), 'en-US')).toBe('Oct 25 – 31')
    expect(formatWeekRange(weekDays(new Date(2026, 10, 2)), 'en-US')).toBe('Nov 1 – 7')
    expect(formatWeekRange(weekDays(new Date(2026, 9, 28 + 7)), 'en-US')).toBe('Nov 1 – 7')
  })
})
