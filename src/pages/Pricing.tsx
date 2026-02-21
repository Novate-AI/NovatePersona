import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSubscription, createCheckoutSession, createPortalSession, type Subscription } from '../lib/subscription'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Get started with limited practice sessions.',
    features: [
      '3 sessions per day',
      'All 3 products (Tutor, IELTS, Patient)',
      '6 OSCE scenarios',
      'Basic band feedback',
      'Progress tracking',
    ],
    limits: [
      'No streak tracking',
      'No detailed domain scores',
    ],
    plan: 'free' as const,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    desc: 'Unlimited practice for students who are serious about results.',
    features: [
      'Unlimited sessions',
      'All 3 products, no limits',
      'Full OSCE domain breakdown',
      'Smart recommendations',
      'Streak & habit tracking',
      'Cloud-synced progress',
      'Priority response speed',
      'Detailed examiner feedback',
    ],
    limits: [],
    plan: 'pro' as const,
    badge: 'Most popular',
  },
  {
    name: 'Institution',
    price: 'Custom',
    period: '',
    desc: 'For universities, medical schools, and language departments.',
    features: [
      'Everything in Pro',
      'Cohort analytics dashboard',
      'Custom scenarios & prompts',
      'LMS integration (Canvas, Moodle)',
      'SSO / SAML',
      'Dedicated support',
      'Volume pricing',
    ],
    limits: [],
    plan: 'institution' as const,
  },
]

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your dashboard — no questions, no hoops. Your access continues until the end of your billing period.',
  },
  {
    q: 'What counts as a "session"?',
    a: 'One session = one conversation. Starting a Novatutor chat, an IELTS part, or an OSCE consultation each count as one session.',
  },
  {
    q: 'Do you offer student discounts?',
    a: 'Pro is already priced for students. For institution-wide access, contact us for bulk pricing that works within education budgets.',
  },
  {
    q: 'Is my data private?',
    a: 'Your conversations are encrypted in transit and at rest. We don\'t sell or share your data. You can delete your account and all data at any time.',
  },
]

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const justPurchased = searchParams.get('success') === 'true'
  const wasCanceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    if (user) getSubscription().then(setSub)
  }, [user])

  async function handleUpgrade() {
    if (!user) {
      window.location.href = '/auth/sign-up'
      return
    }
    setLoading('pro')
    const url = await createCheckoutSession()
    if (url) {
      window.location.href = url
    } else {
      setLoading(null)
      alert('Could not start checkout. Make sure Stripe is configured on the server.')
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

  function getCtaForTier(t: typeof tiers[number]) {
    if (t.plan === 'institution') {
      return { label: 'Talk to us', action: () => { window.location.href = 'mailto:team@novatepersona.com' } }
    }
    if (t.plan === 'free') {
      return { label: user ? 'Current plan' : 'Start free', action: () => { if (!user) window.location.href = '/auth/sign-up' } }
    }
    // Pro
    if (sub?.plan === 'pro') {
      return { label: 'Manage subscription', action: handleManage }
    }
    return { label: 'Start 7-day free trial', action: handleUpgrade }
  }

  return (
    <div className="max-w-5xl mx-auto py-16 sm:py-24 animate-in">
      {/* Success/cancel banners */}
      {justPurchased && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-5 py-3 mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Welcome to Pro! Your subscription is now active.
          </p>
        </div>
      )}
      {wasCanceled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-3 mb-8 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400">Checkout was canceled. No charge was made.</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-sm font-semibold text-brand-500 mb-2">Pricing</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Free to start. Pro when you&apos;re serious.
        </h1>
        <p className="mt-4 text-secondary text-base max-w-lg mx-auto">
          Most students get results on the free tier. Go Pro when you want unlimited reps and smarter feedback.
        </p>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
        {tiers.map(t => {
          const { label, action } = getCtaForTier(t)
          const isCurrent = (sub?.plan === t.plan) || (!sub && t.plan === 'free' && !!user)
          const isLoading = loading === t.plan || (loading === 'manage' && t.plan === 'pro')

          return (
            <div
              key={t.name}
              className={`glass-card flex flex-col relative ${
                t.plan === 'pro' ? 'ring-2 ring-brand-500 md:scale-[1.03] z-10' : ''
              }`}
            >
              {t.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-brand-500 text-white text-xs px-3 py-1">
                  {t.badge}
                </span>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-primary">{t.name}</h3>
                  {isCurrent && (
                    <span className="badge bg-emerald-500/10 text-emerald-500 text-[10px]">Current</span>
                  )}
                </div>
                <p className="text-xs text-secondary mt-1">{t.desc}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-primary">{t.price}</span>
                {t.period && <span className="text-sm text-secondary">{t.period}</span>}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-primary">
                    <svg className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
                {t.limits.map(l => (
                  <li key={l} className="flex items-start gap-2.5 text-sm text-secondary">
                    <svg className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {l}
                  </li>
                ))}
              </ul>

              {t.plan === 'institution' ? (
                <Link
                  to="mailto:team@novatepersona.com"
                  className="block w-full text-center rounded-lg py-2.5 text-sm font-semibold btn-secondary"
                >
                  {label}
                </Link>
              ) : (
                <button
                  onClick={action}
                  disabled={isLoading || (isCurrent && t.plan === 'free')}
                  className={`block w-full text-center rounded-lg py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    t.plan === 'pro' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {isLoading ? 'Loading...' : label}
                </button>
              )}
            </div>
          )
        })}
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
