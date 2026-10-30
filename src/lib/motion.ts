import { flushSync } from 'react-dom'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Runs a state update inside a View Transition so the results grid can
 * animate from its old layout to its new one (cards glide, enter, and leave).
 * Falls back to an instant update when the browser has no View Transitions
 * or the user prefers reduced motion.
 */
export function withViewTransition(update: () => void) {
  if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
