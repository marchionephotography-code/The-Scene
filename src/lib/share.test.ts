import { describe, expect, it } from 'vitest'
import { buildSampleEvents } from '../data/sampleEvents'
import { buildShareText, mailtoHref, smsHref, socialTargets } from './share'

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
})
