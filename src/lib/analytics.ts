type EventName = 'session_started' | 'session_completed' | 'upgrade_wall_shown' | 'upgrade_clicked' | 'signup_completed' | 'page_view'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY

let posthog: any = null

export async function initAnalytics() {
  if (!POSTHOG_KEY) return
  try {
    const modName = 'posthog-js'
    const mod = await (Function('m', 'return import(m)')(modName) as Promise<any>)
    posthog = mod.default
    posthog.init(POSTHOG_KEY, { api_host: 'https://us.i.posthog.com', loaded: () => {} })
  } catch { /* posthog not installed yet */ }
}

export function track(event: EventName, properties?: Record<string, unknown>) {
  if (!posthog) return
  posthog.capture(event, properties)
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!posthog) return
  posthog.identify(userId, traits)
}
