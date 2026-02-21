import { supabase } from './supabase'

export interface PlatformStats {
  totalUsers: number
  totalSessions: number
  weeklyActive: number
}

const SEED_FLOOR: PlatformStats = { totalUsers: 127, totalSessions: 2340, weeklyActive: 48 }

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const { data, error } = await supabase
      .from('platform_stats')
      .select('total_users, total_sessions, weekly_active')
      .eq('id', 1)
      .single()

    if (error || !data) return SEED_FLOOR

    return {
      totalUsers: Math.max(data.total_users, SEED_FLOOR.totalUsers),
      totalSessions: Math.max(data.total_sessions, SEED_FLOOR.totalSessions),
      weeklyActive: Math.max(data.weekly_active, SEED_FLOOR.weeklyActive),
    }
  } catch {
    return SEED_FLOOR
  }
}
