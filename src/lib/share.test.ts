import { describe, expect, it } from 'vitest'
import { buildSampleEvents } from '../data/sampleEvents'
import { appHref, buildShareText, detectPlatform, mailtoHref, PASTE_TARGETS, smsHref, socialTargets } from './share'

describe('sharing', () => {
  const event = buildSampleEvents(new Date(2026, 9, 28, 12))[0]

  it('message names the event and flags sample listings', () => {
    const text = buildShareText(event, 'en-US')
    expect(text).toContain(event.title)
    expect(text).toContain(event.venue)
    expect(text).toContain('Sample listing')
  })

  it('builds encoded text, email, and social links', () => {
    const text = 'Hi & see you at 7?'
    expect(smsHref(text)).toBe('sms:?&body=Hi%20%26%20see%20you%20at%207%3F')
    expect(mailtoHref('Plans', text)).toBe('mailto:?subject=Plans&body=Hi%20%26%20see%20you%20at%207%3F')
    const targets = socialTargets(text)
    expect(targets.map((t) => t.id)).toEqual(['x', 'threads', 'bluesky', 'whatsapp'])
    for (const t of targets) expect(t.href).toContain('Hi%20%26%20see')
  })

  it('includes Instagram, TikTok, and Facebook as copy-then-open targets', () => {
    expect(PASTE_TARGETS.map((t) => t.label)).toEqual(['Instagram', 'TikTok', 'Facebook'])
    for (const t of PASTE_TARGETS) expect(t.href).toMatch(/^https:\/\//)
  })
  it('opens the installed app on phones and the website on computers', () => {
    const ig = PASTE_TARGETS[0]
    expect(appHref(ig, 'ios')).toBe('instagram://app')
    expect(appHref(ig, 'android')).toContain('package=com.instagram.android')
    expect(appHref(ig, 'android')).toContain('browser_fallback_url=https%3A%2F%2Fwww.instagram.com%2F')
    expect(appHref(ig, 'desktop')).toBe('https://www.instagram.com/')
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios')
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android')
  })
})
