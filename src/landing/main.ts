/**
 * Landing page behavior: fonts, the beta sign-up forms, and the towns ribbon.
 * Sign-ups go to Netlify Forms (the "beta" form in index.html); Netlify keeps
 * them in the site's Forms tab and can email each one.
 */
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/figtree'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './landing.css'

const embedded = (() => {
  try { return window.top !== window.self } catch { return true }
})()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function encode(data: FormData): string {
  return new URLSearchParams([...data.entries()].map(([k, v]) => [k, String(v)])).toString()
}

for (const form of document.querySelectorAll<HTMLFormElement>('form.join')) {
  const status = form.querySelector<HTMLElement>('[data-status]')!
  const email = form.querySelector<HTMLInputElement>('input[type=email]')!
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  const original = status.textContent ?? ''

  const say = (text: string, tone: 'info' | 'ok' | 'error') => {
    status.textContent = text
    status.dataset.tone = tone
  }

  email.addEventListener('input', () => {
    email.removeAttribute('aria-invalid')
    if (status.dataset.tone === 'error') say(original, 'info')
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!EMAIL.test(email.value.trim())) {
      email.setAttribute('aria-invalid', 'true')
      say('That email doesn’t look right. Check it and try again.', 'error')
      email.focus()
      return
    }
    if (embedded) {
      say('This is a preview, so nothing was sent. Sign-ups work on the live site.', 'info')
      return
    }
    button.disabled = true
    button.textContent = 'Sending…'
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(new FormData(form)),
      })
      if (!res.ok) throw new Error(String(res.status))
      form.classList.add('join--done')
      say('You’re on the list. We’ll email you when your invite is ready.', 'ok')
      button.textContent = 'You’re in'
    } catch {
      button.disabled = false
      button.textContent = 'Join the beta'
      say('That didn’t go through. Check your connection and try again.', 'error')
    }
  })
}
