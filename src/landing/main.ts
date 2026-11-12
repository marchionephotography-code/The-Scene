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
import { applyTheme, readChoice, setChoice, watchSystemTheme, type Theme } from '../lib/theme'

// Light and dark mode: follows the system until someone taps the switch.
const modeBtn = document.querySelector<HTMLButtonElement>('[data-mode]')
const labelMode = (t: Theme) => modeBtn?.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
labelMode(applyTheme(readChoice()))
watchSystemTheme()
window.addEventListener('scene:theme', () => labelMode(document.documentElement.dataset.theme as Theme))
modeBtn?.addEventListener('click', () => {
  const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  labelMode(setChoice(next))
})

document.documentElement.classList.add('js')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

// Hero: the photo pill in the headline cycles through outings.
const pillImgs = [...document.querySelectorAll<HTMLImageElement>('.pill--rotate img')]
if (pillImgs.length > 1 && !reduceMotion) {
  let i = 0
  setInterval(() => {
    pillImgs[i].style.opacity = '0'
    i = (i + 1) % pillImgs.length
    pillImgs[i].style.opacity = '1'
  }, 2600)
}

// Moods: a small live demo of how picking a mood reshuffles the list.
type Ev = { img: string; when: string; title: string; where: string; price: string }
const MOODS: Record<string, Ev[]> = {
  eat: [
    { img: 'patio', when: 'Fri · 6 PM', title: 'Food Truck Friday', where: 'Easley', price: 'Free' },
    { img: 'dinner', when: 'Sat · 7 PM', title: 'Supper Club on the Patio', where: 'Anderson', price: '$45' },
    { img: 'date', when: 'Sun · 5 PM', title: 'Wine & Small Plates', where: 'Greenville', price: '$30' },
  ],
  date: [
    { img: 'date', when: 'Fri · 8 PM', title: 'Candlelight Tasting Menu', where: 'Greenville', price: '$65' },
    { img: 'lounge', when: 'Sat · 9 PM', title: 'Jazz in the Lounge', where: 'Spartanburg', price: '$15' },
    { img: 'pottery', when: 'Thu · 6 PM', title: 'Couples Pottery Night', where: 'Easley', price: '$40' },
  ],
  out: [
    { img: 'nightout', when: 'Tonight · 9 PM', title: '’90s Dance Party', where: 'Spartanburg', price: '$10' },
    { img: 'festival', when: 'Sat · 4 PM', title: 'Riverfront Music Fest', where: 'Greenville', price: 'Free' },
    { img: 'patio', when: 'Fri · 8 PM', title: 'Trivia Night: ’90s Edition', where: 'Clemson', price: 'Free' },
  ],
  chill: [
    { img: 'hammock', when: 'Sun · 9 AM', title: 'Sunrise Hike & Coffee', where: 'Pickens', price: 'Free' },
    { img: 'lounge', when: 'Sat · 3 PM', title: 'Vinyl Listening Afternoon', where: 'Anderson', price: 'Free' },
    { img: 'camp', when: 'Sat · 7 PM', title: 'Campfire Stories', where: 'Seneca', price: '$5' },
  ],
  active: [
    { img: 'climb', when: 'Sun · 10 AM', title: 'Intro to Bouldering', where: 'Clemson', price: '$20' },
    { img: 'hammock', when: 'Sat · 8 AM', title: 'Lake Hartwell Paddle', where: 'Anderson', price: '$35' },
    { img: 'family', when: 'Sun · 4 PM', title: 'Trail Run Club', where: 'Greenville', price: 'Free' },
  ],
  family: [
    { img: 'family', when: 'Sat · 10 AM', title: 'Farm Day & Hayride', where: 'Pendleton', price: '$8' },
    { img: 'camp', when: 'Sat · 5 PM', title: 'Movie Night Under the Stars', where: 'Greer', price: 'Free' },
    { img: 'pottery', when: 'Sun · 1 PM', title: 'Kids’ Clay Workshop', where: 'Easley', price: '$15' },
  ],
}
const stack = document.querySelector<HTMLOListElement>('[data-stack]')
const chips = [...document.querySelectorAll<HTMLButtonElement>('.moods__chips .chip')]
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
function showMood(id: string, animate: boolean) {
  if (!stack) return
  stack.innerHTML = (MOODS[id] ?? []).map((e) => `<li class="ev"><img src="/landing/p-${e.img}.webp" alt="" width="96" height="96" loading="lazy" /><div><span class="ev__when">${esc(e.when)}</span><span class="ev__title">${esc(e.title)}</span><span class="ev__where">${esc(e.where)}</span></div><span class="ev__price">${esc(e.price)}</span></li>`).join('')
  stack.classList.remove('is-new')
  if (animate) { void stack.offsetWidth; stack.classList.add('is-new') }
  for (const c of chips) c.setAttribute('aria-checked', String(c.dataset.mood === id))
}
showMood('eat', false)
let autoplay: number | undefined
const stopAuto = () => { if (autoplay) { clearInterval(autoplay); autoplay = undefined } }
chips.forEach((chip, idx) => {
  chip.addEventListener('click', () => { stopAuto(); showMood(chip.dataset.mood!, true) })
  chip.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = chips[(idx + step + chips.length) % chips.length]
    next.focus(); next.click()
  })
})
chips.forEach((c) => (c.tabIndex = c.getAttribute('aria-checked') === 'true' ? 0 : -1))
new MutationObserver(() => chips.forEach((c) => (c.tabIndex = c.getAttribute('aria-checked') === 'true' ? 0 : -1)))
  .observe(document.querySelector('.moods__chips')!, { subtree: true, attributes: true, attributeFilter: ['aria-checked'] })

// Start cycling moods only once the section is on screen, and stop for good on first tap.
const moodsEl = document.querySelector('.moods')
const chat = document.querySelector('[data-chat]')
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue
      if (en.target === moodsEl && !reduceMotion && autoplay === undefined && stack?.dataset.touched !== '1') {
        let k = 0
        autoplay = window.setInterval(() => { k = (k + 1) % chips.length; showMood(chips[k].dataset.mood!, true) }, 3200)
      }
      if (en.target === chat) chat.classList.add('is-on')
      io.unobserve(en.target)
    }
  }, { threshold: 0.35 })
  if (moodsEl) io.observe(moodsEl)
  if (chat) io.observe(chat)
} else chat?.classList.add('is-on')
chips.forEach((c) => c.addEventListener('pointerdown', () => { if (stack) stack.dataset.touched = '1'; stopAuto() }))

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
