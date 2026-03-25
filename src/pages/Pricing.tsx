import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getSubscription, createCheckoutSession, createPortalSession,
  PLAN_PRICES, MODULE_INFO,
  type Subscription, type ModuleSlug, type Duration,
} from '../lib/subscription'

const DURATIONS: { key: Duration; label: string; badge?: string }[] = [
  { key: 'monthly', label: '1 month' },
  { key: '3mo', label: '3 months' },
  { key: '6mo', label: '6 months' },
  { key: '12mo', label: '12 months', badge: 'Best value' },
]

const MODULE_SLUGS: ModuleSlug[] = ['novatutor', 'novaielts', 'novapatient']

const COMBO_FEATURES = [
  'Unlimited sessions across all modules',
  'Novatutor — Language conversation practice',
  'NovateExaminer — IELTS Speaking mock exams',
  'NovaPatient — OSCE consultation simulator',
  'Smart recommendations & progress tracking',
  'Streak tracking & cloud sync',
  'Detailed feedback & domain scores',
  'Priority response speed',
]

const SINGLE_FEATURES = [
  'Unlimited sessions for your chosen module',
  'Full feature access within the module',
  'Smart recommendations & progress tracking',
  'Streak tracking & cloud sync',
  'Detailed feedback & scores',
]

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard — no questions. Access continues until the end of your billing period.' },
  { q: 'What counts as a "session"?', a: 'One conversation, one IELTS part (NovateExaminer), or one OSCE consultation each count as one session. Free users get 3 sessions total.' },
  { q: 'Can I switch from single to combo?', a: 'Yes. Upgrade anytime from your billing portal. You\'ll only pay the difference.' },
  { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all plans. No questions asked.' },
  { q: 'Is my data private?', a: 'Your conversations are encrypted in transit and at rest. We don\'t sell or share your data.' },
]

function savingsPercent(type: 'single' | 'combo', dur: Duration): number {
  const monthly = PLAN_PRICES[type].monthly.perMonth
  const current = PLAN_PRICES[type][dur].perMonth
  if (monthly === current) return 0
  return Math.round(((monthly - current) / monthly) * 100)
}

export default function Pricing() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [planType, setPlanType] = useState<'single' | 'combo'>('combo')
  const [duration, setDuration] = useState<Duration>('monthly')
  const [selectedModule, setSelectedModule] = useState<ModuleSlug>('novatutor')

  const justPurchased = searchParams.get('success') === 'true'
  const wasCanceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    if (user) getSubscription().then(setSub)
  }, [user])

  const prices = PLAN_PRICES[planType]
  const price = prices[duration]
  const savings = savingsPercent(planType, duration)

  async function handleSubscribe() {
    if (!user) { window.location.href = '/auth/sign-up'; return }
    const planKey = `${planType}_${duration}`
    setLoading(planKey)
    const url = await createCheckoutSession({
      planKey,
      module: planType === 'single' ? selectedModule : undefined,
    })
    if (url) {
      window.location.href = url
    } else {
      setLoading(null)
      alert('Could not start checkout. Please try again.')
    }
  }

  async function handleManage() {
    setLoading('manage')
    const url = await createPortalSession()
    if (url) {
      window.location.href = url
    } else {
      setLoading(null)
      alert('Could not open billing portal.')
    }
  }

  const isSubscribed = sub && sub.plan !== 'free'

  return (
    <div className="max-w-5xl mx-auto py-16 sm:py-24 animate-in">
      {justPurchased && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-5 py-3 mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Your subscription is now active. Start practising!
          </p>
        </div>
      )}
      {wasCanceled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-3 mb-8 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400">Checkout was canceled. No charge was made.</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-sm font-semibold text-brand-500 mb-2">Pricing</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Practice until you don&apos;t need to
        </h1>
        <p className="mt-4 text-secondary text-base max-w-lg mx-auto">
          3 free sessions to try. Then pick the plan that fits your goals.
        </p>
      </div>

      {/* Plan type toggle */}
        <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg p-1" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
          <button
            onClick={() => setPlanType('single')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              planType === 'single'
                ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            Single Module
          </button>
          <button
            onClick={() => setPlanType('combo')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all relative ${
              planType === 'combo'
                ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            All Modules
            <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none">
              SAVE
            </span>
          </button>
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {DURATIONS.map(d => (
          <button
            key={d.key}
            onClick={() => setDuration(d.key)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              duration === d.key
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'text-secondary hover:text-primary'
            }`}
            style={duration !== d.key ? { borderColor: 'var(--card-border)' } : undefined}
          >
            {d.label}
            {d.badge && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                {d.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main pricing card */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="glass-card ring-2 ring-brand-500 relative overflow-hidden">
          {savings > 0 && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-lg">
              Save {savings}%
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">
                {planType === 'combo' ? 'All Modules' : `Single Module`}
              </h3>
              <p className="text-sm text-secondary mt-1">
                {planType === 'combo'
                  ? 'Novatutor + NovaIELTS + NovaPatient'
                  : `Choose one: ${MODULE_INFO[selectedModule].name}`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-primary">${price.perMonth}</span>
                <span className="text-sm text-secondary">/month</span>
              </div>
              {duration !== 'monthly' && (
                <p className="text-xs text-secondary mt-1">
                  ${price.total} billed every {duration === '3mo' ? '3 months' : duration === '6mo' ? '6 months' : 'year'}
                </p>
              )}
            </div>
          </div>

          {/* Module picker (single only) */}
          {planType === 'single' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
              {MODULE_SLUGS.map(slug => {
                const mod = MODULE_INFO[slug]
                const active = selectedModule === slug
                return (
                  <button
                    key={slug}
                    onClick={() => setSelectedModule(slug)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      active
                        ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500'
                        : 'hover:border-brand-500/30'
                    }`}
                    style={!active ? { borderColor: 'var(--card-border)' } : undefined}
                  >
                    <span className="text-xl">{mod.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${active ? 'text-brand-500' : 'text-primary'}`}>{mod.name}</p>
                      <p className="text-[11px] text-secondary">{mod.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Features */}
          <ul className="space-y-2.5 mb-6">
            {(planType === 'combo' ? COMBO_FEATURES : SINGLE_FEATURES).map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-primary">
                <svg className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isSubscribed ? (
            <button
              onClick={handleManage}
              disabled={loading === 'manage'}
              className="btn-secondary w-full py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading === 'manage' ? 'Loading...' : 'Manage subscription'}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={!!loading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Loading...' : `Subscribe — $${price.total}${duration === 'monthly' ? '/mo' : ` for ${duration === '3mo' ? '3' : duration === '6mo' ? '6' : '12'} months`}`}
            </button>
          )}
        </div>
      </div>

      {/* Free tier note */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="glass-card text-center">
          <h3 className="text-sm font-bold text-primary mb-2">Not ready to commit?</h3>
          <p className="text-sm text-secondary mb-4">
            Every new account gets <strong className="text-primary">3 free sessions</strong> across all modules. No credit card needed.
          </p>
          {!user && (
            <Link to="/auth/sign-up" className="btn-secondary inline-flex px-6 py-2.5 text-sm font-semibold">
              Start free
            </Link>
          )}
        </div>
      </div>

      {/* Comparison table */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-xl font-bold text-center mb-8">Compare plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                <th className="text-left py-3 pr-4 font-semibold text-primary">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-primary">Free</th>
                <th className="text-center py-3 px-4 font-semibold text-primary">Single</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-500">Combo</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
              {[
                ['Sessions', '3 total', 'Unlimited (1 module)', 'Unlimited (all)'],
                ['Novatutor', '✓', 'If selected', '✓'],
                ['NovateExaminer', '✓', 'If selected', '✓'],
                ['NovaPatient', '✓', 'If selected', '✓'],
                ['Progress tracking', '✓', '✓', '✓'],
                ['Streak tracking', '—', '✓', '✓'],
                ['Smart recommendations', '—', '✓', '✓'],
                ['Domain score breakdown', '—', '✓', '✓'],
                ['Priority speed', '—', '✓', '✓'],
                ['Starting price', 'Free', '$5/mo', '$7/mo'],
              ].map(([feature, free, single, combo]) => (
                <tr key={feature} style={{ borderColor: 'var(--card-border)' }}>
                  <td className="py-3 pr-4 text-primary font-medium">{feature}</td>
                  <td className="text-center py-3 px-4 text-secondary">{free}</td>
                  <td className="text-center py-3 px-4 text-secondary">{single}</td>
                  <td className="text-center py-3 px-4 text-primary font-medium">{combo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institution CTA */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="glass-card text-center">
          <h3 className="text-sm font-bold text-primary mb-2">For universities & institutions</h3>
          <p className="text-sm text-secondary mb-4">
            Need access for an entire cohort? We offer custom pricing, LMS integration, and analytics dashboards.
          </p>
          <a href="mailto:team@mynovateai.com" className="btn-secondary inline-flex px-6 py-2.5 text-sm font-semibold">
            Talk to us
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-primary">{f.q}</span>
                <svg className={`h-4 w-4 text-secondary shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-secondary leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
