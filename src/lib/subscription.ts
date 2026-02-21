import { supabase } from './supabase'

export type Plan = 'free' | 'pro'

export interface Subscription {
  plan: Plan
  status: string
  currentPeriodEnd: string | null
}

const ADMIN_EMAILS = ['ceo@mynovateai.com', 'cto@mynovateai.com']
const ADMIN_SUB: Subscription = { plan: 'pro', status: 'active', currentPeriodEnd: null }
const FREE_SUB: Subscription = { plan: 'free', status: 'active', currentPeriodEnd: null }
const FREE_DAILY_LIMIT = 3
const SESSION_COUNT_KEY = 'nv_sessions'
const DEFAULT_PRODUCT = 'nova-patient'

interface DailyCount {
  date: string
  count: number
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getLocalCount(): DailyCount {
  try {
    const raw = localStorage.getItem(SESSION_COUNT_KEY)
    if (!raw) return { date: getTodayStr(), count: 0 }
    const parsed: DailyCount = JSON.parse(raw)
    if (parsed.date !== getTodayStr()) return { date: getTodayStr(), count: 0 }
    return parsed
  } catch {
    return { date: getTodayStr(), count: 0 }
  }
}

function setLocalCount(count: number): void {
  localStorage.setItem(SESSION_COUNT_KEY, JSON.stringify({ date: getTodayStr(), count }))
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function getSessionsUsedToday(): Promise<number> {
  const userId = await getAuthUserId()
  if (userId) {
    try {
      const { data, error } = await supabase.rpc('get_daily_session_count', { p_user_id: userId })
      if (!error && typeof data === 'number') return data
    } catch { /* fall through to localStorage */ }
  }
  return getLocalCount().count
}

export async function getSessionsRemaining(plan: Plan): Promise<number> {
  if (plan === 'pro') return Infinity
  const used = await getSessionsUsedToday()
  return Math.max(0, FREE_DAILY_LIMIT - used)
}

export async function consumeSession(product: string = DEFAULT_PRODUCT): Promise<boolean> {
  const userId = await getAuthUserId()
  if (userId) {
    try {
      const { error } = await supabase
        .from('daily_sessions')
        .insert({ user_id: userId, product })
      if (!error) return true
    } catch { /* fall through to localStorage */ }
  }
  const current = getLocalCount()
  setLocalCount(current.count + 1)
  return true
}

export async function canStartSession(plan: Plan): Promise<boolean> {
  if (plan === 'pro') return true
  const used = await getSessionsUsedToday()
  return used < FREE_DAILY_LIMIT
}

export const FREE_LIMIT = FREE_DAILY_LIMIT

export function isAdminEmail(email: string | undefined | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function getSubscription(): Promise<Subscription> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return FREE_SUB

    if (isAdminEmail(user.email)) return ADMIN_SUB

    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .single()

    if (error || !data) return FREE_SUB

    const isActive = data.status === 'active' || data.status === 'trialing'
    if (!isActive) return FREE_SUB

    return {
      plan: data.plan as Plan,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
    }
  } catch {
    return FREE_SUB
  }
}

export async function createCheckoutSession(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace('/api/chat', '') || 'http://localhost:5000'

    const res = await fetch(`${backendUrl}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        returnUrl: window.location.origin + '/pricing',
      }),
    })

    if (!res.ok) return null
    const { url } = await res.json()
    return url
  } catch {
    return null
  }
}

export async function createPortalSession(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace('/api/chat', '') || 'http://localhost:5000'

    const res = await fetch(`${backendUrl}/api/stripe/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId: session.user.id,
        returnUrl: window.location.origin + '/pricing',
      }),
    })

    if (!res.ok) return null
    const { url } = await res.json()
    return url
  } catch {
    return null
  }
}
