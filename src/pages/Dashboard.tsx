import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProgress, getStreak, type ScenarioResult, type UserStreak } from '../lib/progress'
import { getSubscription, getSessionsUsed, FREE_LIMIT, type PlanType } from '../lib/subscription'
import { useAuth } from '../contexts/AuthContext'
import { scenarios } from '../lib/scenarios'

const DOMAINS = ['history_taking', 'communication', 'clinical_reasoning', 'patient_centered'] as const
const DOMAIN_LABELS: Record<string, string> = {
  history_taking: 'History Taking',
  communication: 'Communication',
  clinical_reasoning: 'Clinical Reasoning',
  patient_centered: 'Patient-Centred Care',
}

function domainColor(score: number): string {
  if (score >= 7) return 'bg-emerald-500'
  if (score >= 5) return 'bg-amber-500'
  return 'bg-red-500'
}

function domainTextColor(score: number): string {
  if (score >= 7) return 'text-emerald-500'
  if (score >= 5) return 'text-amber-500'
  return 'text-red-500'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface DashboardData {
  patientProgress: ScenarioResult[]
  ieltsProgress: ScenarioResult[]
  tutorProgress: ScenarioResult[]
  streak: UserStreak
  plan: PlanType
  sessionsUsed: number
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--subtle-bg)' }} />
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-5 space-y-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20" />
        ))}
      </div>
      <SkeletonBlock className="h-24" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-44" />
        ))}
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [patientProgress, ieltsProgress, tutorProgress, streak, sub] = await Promise.all([
        getProgress('nova-patient'),
        getProgress('nova-ielts'),
        getProgress('novatutor'),
        getStreak(),
        getSubscription(),
      ])
      const sessionsUsed = await getSessionsUsed()
      setData({
        patientProgress,
        ieltsProgress,
        tutorProgress,
        streak,
        plan: sub.plan,
        sessionsUsed,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !data) return <LoadingSkeleton />

  const { patientProgress, ieltsProgress, tutorProgress, streak, plan, sessionsUsed } = data
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const totalScenarios = scenarios.length

  const bestScore = patientProgress.length > 0
    ? Math.max(...patientProgress.map(r => r.score))
    : null
  const avgScore = patientProgress.length > 0
    ? Math.round((patientProgress.reduce((s, r) => s + r.score, 0) / patientProgress.length) * 10) / 10
    : null

  // Merge all results for recent activity
  const allResults = [
    ...patientProgress.map(r => ({ ...r, product: 'NovaPatient' })),
    ...ieltsProgress.map(r => ({ ...r, product: 'NovateExaminer' })),
    ...tutorProgress.map(r => ({ ...r, product: 'Novatutor' })),
  ]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)

  // Domain averages for NovaPatient weak areas
  const domainAverages = DOMAINS.map(domain => {
    const scores = patientProgress
      .filter(r => r.metadata && typeof r.metadata[domain] === 'number')
      .map(r => r.metadata![domain] as number)
    const avg = scores.length > 0
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      : 0
    return { domain, label: DOMAIN_LABELS[domain], avg, count: scores.length }
  })

  const isPaid = plan !== 'free'
  const sessionPct = isPaid ? 100 : Math.min(100, (sessionsUsed / FREE_LIMIT) * 100)

  return (
    <div className="max-w-5xl mx-auto py-10 px-5 animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          Your Progress
        </h1>
        <p className="mt-1 text-secondary text-sm sm:text-base">
          Welcome back, {firstName}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card text-center py-4!">
          <span className="text-2xl font-bold text-primary tabular-nums">
            {streak.currentStreak}<span className="ml-1">🔥</span>
          </span>
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider mt-1">Current Streak</p>
        </div>
        <div className="glass-card text-center py-4!">
          <span className="text-2xl font-bold text-primary tabular-nums">{streak.longestStreak}</span>
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider mt-1">Longest Streak</p>
        </div>
        <div className="glass-card text-center py-4!">
          <span className="text-2xl font-bold text-primary tabular-nums">{streak.totalSessions}</span>
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider mt-1">Total Sessions</p>
        </div>
        <div className="glass-card text-center py-4!">
          <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${
            plan !== 'free'
              ? 'bg-violet-500/10 text-violet-500'
              : 'bg-zinc-500/10 text-secondary'
          }`}>
            {plan === 'combo' ? 'Combo' : plan === 'single' ? 'Single' : 'Free'}
          </span>
          <p className="text-xs text-secondary font-semibold uppercase tracking-wider mt-2">Current Plan</p>
        </div>
      </div>

      {/* Sessions */}
      <div className="glass-card mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-primary">Free Sessions</h3>
          <span className="text-sm font-bold tabular-nums text-primary">
            {isPaid ? (
              <span className="text-violet-500">Unlimited</span>
            ) : (
              <>{sessionsUsed}<span className="text-secondary font-normal">/{FREE_LIMIT}</span></>
            )}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--subtle-bg)' }}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isPaid
                ? 'bg-violet-500'
                : sessionsUsed >= FREE_LIMIT
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${sessionPct}%` }}
          />
        </div>
        {plan === 'free' && sessionsUsed >= FREE_LIMIT && (
          <p className="text-xs text-secondary mt-2">
            Free sessions used up.{' '}
            <Link to="/pricing" className="text-violet-500 font-semibold hover:underline">
              Subscribe
            </Link>{' '}
            for unlimited practice.
          </p>
        )}
      </div>

      {/* Product breakdown */}
      <h2 className="text-lg font-bold text-primary mb-4">Product Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* NovaPatient */}
        <Link to="/nova-patient" className="glass-card group hover:shadow-lg transition-shadow duration-300 hover:shadow-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-400 text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">NovaPatient</h3>
              <span className="text-xs text-secondary">Clinical OSCE</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Completed</span>
              <span className="font-bold text-primary tabular-nums">{patientProgress.length}/{totalScenarios}</span>
            </div>
            {bestScore !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Best Score</span>
                <span className="font-bold text-emerald-500 tabular-nums">{bestScore}/40</span>
              </div>
            )}
            {avgScore !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Avg Score</span>
                <span className="font-bold text-primary tabular-nums">{avgScore}/40</span>
              </div>
            )}
            {patientProgress.length === 0 && (
              <p className="text-xs text-secondary italic">No sessions yet</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Practice
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </div>
        </Link>

        {/* NovateExaminer */}
        <Link to="/novate-examiner" className="glass-card group hover:shadow-lg transition-shadow duration-300 hover:shadow-violet-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-400 text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">NovateExaminer</h3>
              <span className="text-xs text-secondary">Exam Prep</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Sessions</span>
              <span className="font-bold text-primary tabular-nums">{ieltsProgress.length}</span>
            </div>
            {ieltsProgress.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Latest Band</span>
                <span className="font-bold text-violet-500 tabular-nums">{ieltsProgress[0].score}</span>
              </div>
            )}
            {ieltsProgress.length === 0 && (
              <p className="text-xs text-secondary italic">No sessions yet</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
            Practice
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </div>
        </Link>

        {/* Novatutor */}
        <Link to="/novatutor" className="glass-card group hover:shadow-lg transition-shadow duration-300 hover:shadow-blue-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-cyan-400 text-white shadow-lg">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364V3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Novatutor</h3>
              <span className="text-xs text-secondary">Language</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Sessions</span>
              <span className="font-bold text-primary tabular-nums">{tutorProgress.length}</span>
            </div>
            {tutorProgress.length === 0 && (
              <p className="text-xs text-secondary italic">No sessions yet</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
            Practice
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      {allResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-4">Recent Activity</h2>
          <div className="glass-card p-0! overflow-hidden">
            <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
              {allResults.map((r, i) => (
                <div key={`${r.product}-${r.scenarioCode}-${i}`} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{r.scenarioCode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                    <p className="text-xs text-secondary">{r.product}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.score != null && (
                      <span className="text-sm font-bold text-primary tabular-nums">{r.score}</span>
                    )}
                    {r.grade && (
                      <span className={`badge text-xs border ${
                        r.grade === 'Distinction' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        r.grade === 'Pass' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        r.grade === 'Borderline' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>{r.grade}</span>
                    )}
                    <span className="text-xs text-secondary tabular-nums">{formatDate(r.completedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weak Areas (NovaPatient domains) */}
      {patientProgress.length > 0 && domainAverages.some(d => d.count > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-4">Weak Areas</h2>
          <p className="text-xs text-secondary mb-4">Average domain scores across your NovaPatient sessions</p>
          <div className="glass-card space-y-5">
            {domainAverages.map(d => (
              <div key={d.domain}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-primary">{d.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${domainTextColor(d.avg)}`}>
                    {d.count > 0 ? `${d.avg}/10` : '—'}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--subtle-bg)' }}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${d.count > 0 ? domainColor(d.avg) : ''}`}
                    style={{ width: d.count > 0 ? `${(d.avg / 10) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allResults.length === 0 && (
        <div className="glass-card text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <h3 className="text-lg font-bold text-primary mb-1">No sessions yet</h3>
          <p className="text-sm text-secondary mb-6 max-w-sm mx-auto">
            Complete your first practice session in any product to start tracking your progress.
          </p>
          <Link to="/" className="btn-primary px-6 py-2.5 inline-flex">
            Start practicing
          </Link>
        </div>
      )}
    </div>
  )
}
