const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

let sentry: any = null

export async function initErrorTracking() {
  if (!SENTRY_DSN) return
  try {
    const modName = '@sentry/react'
    const mod = await (Function('m', 'return import(m)')(modName) as Promise<any>)
    sentry = mod
    sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1 })
  } catch { /* @sentry/react not installed yet */ }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error('[ErrorTracking]', error.message, context)
  if (!sentry) return
  sentry.captureException(error, { extra: context })
}
