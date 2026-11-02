import { useEffect, useState } from 'react'

/** Every photo in src/assets/hero, as hero-NN-900.webp / hero-NN-1800.webp. */
const small = import.meta.glob<string>('../assets/hero/*-900.webp', { eager: true, import: 'default' })
const large = import.meta.glob<string>('../assets/hero/*-1800.webp', { eager: true, import: 'default' })

const all = Object.keys(small)
  .sort()
  .map((k) => ({ src: small[k], srcSet: `${small[k]} 900w, ${large[k.replace('-900', '-1800')]} 1800w` }))

/** Start on the outdoor dinner (hero-03), the photo the header launched with. */
const START = 2
const PHOTOS = [...all.slice(START), ...all.slice(0, START)]
const HOLD_MS = 6000

/**
 * The header photo, cross-fading through the hero folder. Only the current,
 * outgoing, and next photos are in the page, so it doesn't download all of
 * them at once. Holds still for reduced motion and while the tab is hidden.
 */
export function HeroRotator() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (PHOTOS.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => {
      if (document.hidden) return
      setIndex((i) => i + 1)
    }, HOLD_MS)
    return () => window.clearInterval(t)
  }, [])

  const n = PHOTOS.length
  const current = index % n
  const prev = index > 0 ? (index - 1) % n : null
  const next = (index + 1) % n
  return (
    <>
      {PHOTOS.map((p, i) => {
        if (i !== current && i !== prev && i !== next) return null
        const state = i === current ? ' hero-img--on' : i === prev ? ' hero-img--out' : ''
        return (
          <img
            key={p.src}
            className={`hero-img${state}${i === 0 && index === 0 ? ' hero-img--first' : ''}`}
            src={p.src}
            srcSet={p.srcSet}
            sizes="(min-width: 760px) 640px, 100vw"
            alt=""
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
          />
        )
      })}
    </>
  )
}
