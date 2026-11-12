import { describe, expect, it } from 'vitest'
import { readChoice, resolveTheme } from './theme'

describe('theme', () => {
  it('reads a saved choice and falls back to auto', () => {
    expect(readChoice({ getItem: () => 'dark' })).toBe('dark')
    expect(readChoice({ getItem: () => 'light' })).toBe('light')
    expect(readChoice({ getItem: () => 'purple' })).toBe('auto')
    expect(readChoice({ getItem: () => null })).toBe('auto')
    expect(readChoice({ getItem: () => { throw new Error('blocked') } })).toBe('auto')
  })
  it('auto follows the system', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})
