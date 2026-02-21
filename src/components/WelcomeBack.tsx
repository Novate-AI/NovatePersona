import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getStreak, type UserStreak } from '../lib/progress'

const DISMISSED_KEY = 'wb_dismissed'

function getDismissedToday(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY)
  if (!raw) return false
  return raw === new Date().toISOString().slice(0, 10)
}

export default function WelcomeBack() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (!user) return
    if (getDismissedToday()) return
    setDismissed(false)
    getStreak().then(setStreak)
  }, [user])

  if (!user || dismissed || !streak) return null

  const name = user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const lastDate = streak.lastPracticeDate
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let message: string
  let urgency: 'green' | 'amber' | 'red'
  let cta: string

  if (!lastDate) {
    message = `Welcome, ${name}! Start your first session to build momentum.`
    urgency = 'green'
    cta = 'Start first session'
  } else if (lastDate === today) {
    message = `Nice work today, ${name}! You're on a ${streak.currentStreak}-day streak.`
    urgency = 'green'
    cta = 'Keep going'
  } else if (lastDate === yesterday) {
    message = `Welcome back, ${name}! ${streak.currentStreak}-day streak — practise now to keep it alive.`
    urgency = 'amber'
    cta = "Don't break the streak"
  } else {
    const daysMissed = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
    message = `${name}, it's been ${daysMissed} days. Your streak reset — start a new one now.`
    urgency = 'red'
    cta = 'Restart streak'
  }

  const colors = {
    green: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    red: 'border-red-500/30 bg-red-500/5',
  }
  const iconColors = {
    green: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString().slice(0, 10))
    setDismissed(true)
  }

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 animate-in mb-6 ${colors[urgency]}`}>
      <span className={`text-xl shrink-0 ${iconColors[urgency]}`}>
        {urgency === 'green' ? '🔥' : urgency === 'amber' ? '⚡' : '💀'}
      </span>
      <p className="text-sm text-primary flex-1">{message}</p>
      <Link
        to="/nova-patient"
        onClick={dismiss}
        className="btn-primary text-xs px-3 py-1.5 shrink-0"
      >
        {cta}
      </Link>
      <button onClick={dismiss} className="text-secondary hover:text-primary shrink-0" aria-label="Dismiss">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
