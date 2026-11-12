// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installLinkGuard } from './links'

function setup(embedded: boolean) {
  const open = vi.fn()
  const win = { top: embedded ? {} : undefined, self: {}, open, location: { href: 'https://scene.example/', origin: 'https://scene.example' } } as unknown as Window
  if (!embedded) (win as unknown as { top: unknown }).top = (win as unknown as { self: unknown }).self
  const off = installLinkGuard(document, win)
  const click = (html: string) => {
    document.body.innerHTML = html
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    document.querySelector('a')!.dispatchEvent(ev)
    return ev.defaultPrevented
  }
  return { open, off, click }
}

let off = () => {}
afterEach(() => off())

describe('link guard', () => {
  it('opens outside pages in a new tab', () => {
    const t = setup(false); off = t.off
    expect(t.click('<a href="https://maps.apple.com/?q=x">Map</a>')).toBe(true)
    expect(t.open).toHaveBeenCalledWith('https://maps.apple.com/?q=x', '_blank', 'noopener')
  })
  it('lets in-page links and real-phone app links through', () => {
    const t = setup(false); off = t.off
    expect(t.click('<a href="#calendar">Cal</a>')).toBe(false)
    expect(t.click('<a href="instagram://app" data-web="https://www.instagram.com/">IG</a>')).toBe(false)
  })
  it('in a preview, sends app links to their website and opens texts in a new tab', () => {
    const t = setup(true); off = t.off
    expect(t.click('<a href="instagram://app" data-web="https://www.instagram.com/">IG</a>')).toBe(true)
    expect(t.open).toHaveBeenCalledWith('https://www.instagram.com/', '_blank', 'noopener')
    expect(t.click('<a href="sms:?&body=hi">Text</a>')).toBe(true)
  })
})
