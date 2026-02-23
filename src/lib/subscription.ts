import { supabase } from './supabase'

export type PlanType = 'free' | 'single' | 'combo'
export type ModuleSlug = 'novatutor' | 'novaielts' | 'novapatient'
export type Duration = 'monthly' | '3mo' | '6mo' | '12mo'

export interface Subscription {
  plan: PlanType
  module: ModuleSlug | null
  status: string
  currentPeriodEnd: string | null
}

const ADMIN_EMAILS = ['ceo@mynovateai.com', 'cto@mynovateai.com']
const ADMIN_SUB: Subscription = { plan: 'combo', module: null, status: 'active', currentPeriodEnd: null }
const FREE_SUB: Subscription = { plan: 'free', module: null, status: 'active', currentPeriodEnd: null }
const FREE_TOTAL_LIMIT = 3
const SESSION_COUNT_KEY = 'nv_sessions_total'

function getLocalCount(): number {
  try {
    return parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10)
  } catch {
    return 0
  }
}

function bumpLocalCount(): void {
  localStorage.setItem(SESSION_COUNT_KEY, String(getLocalCount() + 1))
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function getSessionsUsed(): Promise<number> {
  const userId = await getAuthUserId()
  if (userId) {
    try {
      const { count, error } = await supabase
        .from('daily_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (!error && typeof count === 'number') return count
    } catch { /* fall through */ }
  }
  return getLocalCount()
}

export async function getSessionsRemaining(plan: PlanType): Promise<number> {
  if (plan !== 'free') return Infinity
  const used = await getSessionsUsed()
  return Math.max(0, FREE_TOTAL_LIMIT - used)
}

export async function consumeSession(product: string = 'nova-patient'): Promise<boolean> {
  const userId = await getAuthUserId()
  if (userId) {
    try {
      const { error } = await supabase
        .from('daily_sessions')
        .insert({ user_id: userId, product })
      if (!error) return true
    } catch { /* fall through */ }
  }
  bumpLocalCount()
  return true
}

export async function canStartSession(plan: PlanType): Promise<boolean> {
  if (plan !== 'free') return true
  const used = await getSessionsUsed()
  return used < FREE_TOTAL_LIMIT
}

export function hasModuleAccess(sub: Subscription, moduleSlug: ModuleSlug): boolean {
  if (sub.plan === 'combo') return true
  if (sub.plan === 'single' && sub.module === moduleSlug) return true
  return false
}

export const FREE_LIMIT = FREE_TOTAL_LIMIT

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
      .select('plan, status, current_period_end, module')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return FREE_SUB

    const isActive = data.status === 'active' || data.status === 'trialing'
    if (!isActive) return FREE_SUB

    return {
      plan: (data.plan as PlanType) || 'free',
      module: (data.module as ModuleSlug) || null,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
    }
  } catch {
    return FREE_SUB
  }
}

export interface CheckoutParams {
  planKey: string        // e.g. 'single_monthly', 'combo_12mo'
  module?: ModuleSlug    // only for single plans
}

export async function createCheckoutSession(params: CheckoutParams): Promise<string | null> {
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
        planKey: params.planKey,
        module: params.module || null,
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

// Plan pricing data (used by Pricing page)
export const PLAN_PRICES = {
  single: {
    monthly: { perMonth: 12, total: 12 },
    '3mo':   { perMonth: 10, total: 30 },
    '6mo':   { perMonth: 7,  total: 42 },
    '12mo':  { perMonth: 5,  total: 60 },
  },
  combo: {
    monthly: { perMonth: 15, total: 15 },
    '3mo':   { perMonth: 12, total: 36 },
    '6mo':   { perMonth: 10, total: 60 },
    '12mo':  { perMonth: 7,  total: 84 },
  },
} as const

export const MODULE_INFO: Record<ModuleSlug, { name: string; desc: string; icon: string }> = {
  novatutor:   { name: 'Novatutor',   desc: 'Language conversation practice', icon: '💬' },
  novaielts:   { name: 'NovateExaminer',   desc: 'IELTS Speaking mock exams',     icon: '🎤' },
  novapatient: { name: 'NovaPatient', desc: 'OSCE consultation simulator',    icon: '🩺' },
}
