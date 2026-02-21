import { supabase } from './supabase'

const STORAGE_KEY = "np_progress"
const SESSION_KEY = "np_session"
const ONBOARDING_KEY = "np_onboarded"

export interface ScenarioResult {
  scenarioCode: string
  score: number
  grade: string
  completedAt: string
  product?: string
  metadata?: Record<string, unknown>
}

export interface SessionData {
  scenarioCode: string
  messages: { role: string; content: string }[]
  checklist: unknown[]
  remainingSeconds: number
  savedAt: string
}

export interface UserStreak {
  currentStreak: number
  longestStreak: number
  lastPracticeDate: string | null
  totalSessions: number
}

// ─── Helper: get current user ID ───
function getUserId(): string | null {
  try {
    const raw = localStorage.getItem('sb-hgjuawsdaikusovlbave-auth-token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.user?.id ?? null
  } catch {
    return null
  }
}

// ─── Progress: cloud-synced when authenticated, localStorage fallback ───

export async function getProgress(product = 'nova-patient'): Promise<ScenarioResult[]> {
  const userId = getUserId()

  if (userId) {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('scenario_code, score, grade, metadata, completed_at')
        .eq('user_id', userId)
        .eq('product', product)
        .order('completed_at', { ascending: false })

      if (!error && data) {
        return data.map(r => ({
          scenarioCode: r.scenario_code,
          score: Number(r.score),
          grade: r.grade || '',
          completedAt: r.completed_at,
          product,
          metadata: r.metadata as Record<string, unknown> | undefined,
        }))
      }
    } catch { /* fall through to localStorage */ }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function saveResult(result: ScenarioResult): Promise<void> {
  const userId = getUserId()
  const product = result.product || 'nova-patient'

  if (userId) {
    try {
      await supabase.from('user_progress').upsert({
        user_id: userId,
        product,
        scenario_code: result.scenarioCode,
        score: result.score,
        grade: result.grade,
        metadata: result.metadata || {},
        completed_at: result.completedAt || new Date().toISOString(),
      }, {
        onConflict: 'user_id,product,scenario_code',
      })

      await updateStreak(userId)
      return
    } catch { /* fall through */ }
  }

  // localStorage fallback
  const progress = await getProgress()
  const existing = progress.findIndex(p => p.scenarioCode === result.scenarioCode)
  if (existing >= 0) {
    if (result.score > progress[existing].score) {
      progress[existing] = result
    }
  } else {
    progress.push(result)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export async function getBestScore(scenarioCode: string, product = 'nova-patient'): Promise<ScenarioResult | null> {
  const progress = await getProgress(product)
  return progress.find(p => p.scenarioCode === scenarioCode) || null
}

// ─── Streak tracking ───

async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_practice_date: today,
      total_sessions: 1,
    })
    return
  }

  const lastDate = existing.last_practice_date
  if (lastDate === today) {
    // Already practised today — just bump session count
    await supabase.from('user_streaks').update({
      total_sessions: existing.total_sessions + 1,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)
    return
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  let newStreak: number
  if (lastDate === yesterdayStr) {
    newStreak = existing.current_streak + 1
  } else {
    newStreak = 1
  }

  const longestStreak = Math.max(newStreak, existing.longest_streak)

  await supabase.from('user_streaks').update({
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_practice_date: today,
    total_sessions: existing.total_sessions + 1,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
}

export async function getStreak(): Promise<UserStreak> {
  const userId = getUserId()
  const defaultStreak: UserStreak = { currentStreak: 0, longestStreak: 0, lastPracticeDate: null, totalSessions: 0 }

  if (!userId) return defaultStreak

  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return defaultStreak

    // Check if streak is still valid (last practice was today or yesterday)
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const isActive = data.last_practice_date === today || data.last_practice_date === yesterdayStr

    return {
      currentStreak: isActive ? data.current_streak : 0,
      longestStreak: data.longest_streak,
      lastPracticeDate: data.last_practice_date,
      totalSessions: data.total_sessions,
    }
  } catch {
    return defaultStreak
  }
}

// ─── Session persistence (stays in localStorage — ephemeral by nature) ───

export function saveSession(data: SessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true"
}

export function markOnboarded(): void {
  localStorage.setItem(ONBOARDING_KEY, "true")
}
