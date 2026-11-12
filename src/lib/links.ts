/**
 * Keeps people inside The Scene when they tap a link.
 *
 * Outside pages (maps, ticket sites, library calendars) always open in a new
 * tab. Inside an embedded preview, a link that tries to replace the page
 * shows a blank screen instead, so there every outside link, email, text,
 * and app link opens in a new tab; app links (instagram://, fb://) fall back
 * to the website named in data-web, since previews can't open apps.
 */
const APP_SCHEMES = /^(instagram|fb|snssdk\d+|tiktok|intent|twitter|threads|whatsapp):/i
const HANDOFF = /^(mailto|sms|tel):/i

export interface OutsideLink {
  href: string
  /** A version of the page that is allowed to show inside the app (e.g. a map embed). */
  embed?: string
  /** What the link said, for the page title. */
  label: string
}

/** Set by the app: show outside pages in its own viewer with a Back button. */
let viewer: ((l: OutsideLink) => void) | null = null
export function setLinkViewer(fn: ((l: OutsideLink) => void) | null): void {
  viewer = fn
}

export function installLinkGuard(doc: Document = document, win: Window = window): () => void {
  const embedded = (() => {
    try { return win.top !== win.self } catch { return true }
  })()

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!a || a.hasAttribute('download')) return
    const raw = a.getAttribute('href') ?? ''
    if (!raw || raw.startsWith('#')) return

    if (APP_SCHEMES.test(raw)) {
      if (!embedded) return // a real phone browser hands this to the app
      e.preventDefault()
      const web = a.dataset.web
      if (web) win.open(web, '_blank', 'noopener')
      return
    }
    if (HANDOFF.test(raw)) {
      if (!embedded) return
      e.preventDefault()
      win.open(raw, '_blank')
      return
    }
    let url: URL
    try { url = new URL(raw, win.location.href) } catch { return }
    if (!/^https?:$/.test(url.protocol)) return
    const outside = url.origin !== win.location.origin
    if (outside || embedded) {
      e.preventDefault()
      if (viewer && a.dataset.noViewer === undefined) {
        viewer({ href: url.href, embed: a.dataset.embed, label: (a.getAttribute('aria-label') || a.textContent || '').trim() })
      } else {
        win.open(url.href, '_blank', 'noopener')
      }
    }
  }
  doc.addEventListener('click', onClick)
  return () => doc.removeEventListener('click', onClick)
}
