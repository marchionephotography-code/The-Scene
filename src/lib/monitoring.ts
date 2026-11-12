/**
 * Error tracking (optional). With VITE_SENTRY_DSN set, crashes and unhandled
 * errors are reported to Sentry so problems show up before users email about
 * them. Without it, nothing is loaded or sent. No personal details are sent:
 * no names, emails, phone numbers, or locations.
 */
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

type Sentry = typeof import('@sentry/browser')
let sentry: Promise<Sentry> | null = null

export function startMonitoring(): void {
  if (!DSN || import.meta.env.DEV) return
  sentry = import('@sentry/browser').then((S) => {
    S.init({
      dsn: DSN,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeSend(event) {
        delete event.user
        if (event.request) delete event.request.cookies
        return event
      },
    })
    return S
  })
}

export function reportError(error: unknown, where?: string): void {
  if (import.meta.env.DEV) console.error(where ?? 'error', error)
  void sentry?.then((S) => S.captureException(error, where ? { tags: { where } } : undefined))
}
