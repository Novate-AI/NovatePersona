import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  total_sessions: number
  current_streak: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function firstName(name: string): string {
  const first = name.split(' ')[0]
  return first.length > 14 ? first.slice(0, 12) + '…' : first
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error: rpcError } = await supabase.rpc('get_leaderboard')
      if (rpcError) {
        setError('Could not load leaderboard.')
        setLoading(false)
        return
      }
      setEntries((data as LeaderboardEntry[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-2xl py-10 px-4 animate-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
        <p className="text-sm text-secondary mt-1">Top practitioners this week</p>
      </div>

      <div className="glass-card p-0! overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-secondary text-sm">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl mb-4 block">🏆</span>
            <h3 className="text-lg font-bold text-primary mb-2">The board is wide open</h3>
            <p className="text-sm text-secondary mb-6 max-w-xs mx-auto">
              Complete your first session to claim the #1 spot. Early adopters get bragging rights.
            </p>
            <Link to="/nova-patient" className="btn-primary px-5 py-2.5 inline-flex text-sm">
              Start a session
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[4rem_1fr_6rem_6rem] gap-2 px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-widest text-secondary border-b"
              style={{ borderColor: 'var(--card-border)' }}>
              <span>Rank</span>
              <span>Name</span>
              <span className="text-right">Sessions</span>
              <span className="text-right">Streak</span>
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
              {entries.map((entry) => {
                const isMe = user?.id === entry.user_id
                return (
                  <div
                    key={entry.user_id}
                    className={`grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[4rem_1fr_6rem_6rem] gap-2 px-4 sm:px-6 py-3 items-center transition-colors ${
                      isMe ? 'bg-emerald-500/8' : 'hover:bg-(--card-bg)'
                    }`}
                  >
                    <span className="text-sm font-bold tabular-nums">
                      {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                    </span>
                    <span className={`text-sm truncate ${isMe ? 'font-bold text-emerald-500' : 'text-primary'}`}>
                      {firstName(entry.display_name)}
                      {isMe && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500/70">(you)</span>}
                    </span>
                    <span className="text-sm text-primary text-right tabular-nums font-semibold">{entry.total_sessions}</span>
                    <span className="text-sm text-secondary text-right tabular-nums">
                      {entry.current_streak > 0 ? `${entry.current_streak}d` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {user && entries.length > 0 && !entries.some(e => e.user_id === user.id) && (
        <p className="text-center text-xs text-secondary mt-4">
          Complete more sessions to appear on the leaderboard.
        </p>
      )}
    </div>
  )
}
