import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getPlatformStats, type PlatformStats } from '../lib/stats'
import WelcomeBack from '../components/WelcomeBack'

const HOOKS = [
  "You freeze mid-sentence in Spanish.",
  "You bombed your last IELTS mock.",
  "You forgot the drug history. Again.",
  "Your tutor cancelled. Again.",
  "Your OSCE is in 3 weeks.",
]

const products = [
  {
    to: '/novatutor',
    name: 'Novatutor',
    tag: 'Language',
    desc: 'Speak freely in 10+ languages. Get corrected in real-time without the awkwardness of a real tutor.',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'group-hover:shadow-blue-500/20',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364V3" />
      </svg>
    ),
  },
  {
    to: '/nova-ielts',
    name: 'Nova IELTS',
    tag: 'Exam Prep',
    desc: 'Run full 3-part speaking mocks as many times as you need. Band scores and feedback in seconds.',
    gradient: 'from-violet-500 to-purple-400',
    glow: 'group-hover:shadow-violet-500/20',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    to: '/nova-patient',
    name: 'NovaPatient',
    tag: 'Clinical',
    desc: 'Take a focused history under exam conditions. Get graded on the same 4 domains your examiner uses.',
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'group-hover:shadow-emerald-500/20',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

const testimonials = [
  {
    quote: "I used NovaPatient the week before my OSCE and scored Distinction on 4 out of 6 stations. The feedback is genuinely useful.",
    name: "Fatima A.",
    role: "3rd year medical student",
    product: 'NovaPatient',
  },
  {
    quote: "My IELTS speaking went from 6.0 to 7.5 in two months. I practised every morning before work with Novatutor.",
    name: "Carlos M.",
    role: "Software engineer, Brazil",
    product: 'Nova IELTS',
  },
  {
    quote: "We rolled this out across our Year 3 cohort. Students who used it 3+ times a week scored 12% higher on OSCEs.",
    name: "Dr. Sarah Chen",
    role: "Clinical skills lead, UCL",
    product: 'Institution',
  },
]

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`
  if (n > 0) return `${n}+`
  return '—'
}

export default function Home() {
  const [hookIdx, setHookIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setHookIdx((i) => (i + 1) % HOOKS.length)
        setVisible(true)
      }, 400)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    getPlatformStats().then(setStats)
  }, [])

  const displayStats = [
    { value: stats ? formatStat(stats.totalUsers) : '—', label: 'Students' },
    { value: '10+', label: 'Languages' },
    { value: stats ? formatStat(stats.totalSessions) : '—', label: 'Sessions' },
  ]

  return (
    <div className="relative isolate overflow-hidden">
      {/* Welcome back nudge */}
      <div className="mx-auto max-w-3xl pt-6 px-1">
        <WelcomeBack />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-3xl py-16 sm:py-24 text-center">
        {/* Rotating pain hook */}
        <div className="h-8 mb-8 flex items-center justify-center">
          <p className={`text-sm sm:text-base text-secondary italic transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            &ldquo;{HOOKS[hookIdx]}&rdquo;
          </p>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
          Practice here until<br />
          <span className="gradient-text">you don&apos;t.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-secondary">
          Conversations, exams, and consultations — on repeat, on your terms, with no one watching.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <a href="#products" className="btn-primary px-6 py-3">
            Start practicing
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-secondary">
          {displayStats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 sm:gap-3">
              <div className="text-center sm:text-left">
                <span className="text-base sm:text-lg font-bold text-primary tabular-nums">{s.value}</span>
                <span className="text-[11px] sm:text-xs ml-1 sm:ml-1.5">{s.label}</span>
              </div>
              {i < displayStats.length - 1 && <div className="hidden sm:block h-4 w-px bg-(--card-border) ml-3" />}
            </div>
          ))}
        </div>
      </section>

      {/* Product demo preview */}
      <section className="mx-auto max-w-4xl pb-20">
        <div className="glass-card overflow-hidden p-0!">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-[10px] text-secondary ml-2 font-mono">NovatePersona — NovaPatient</span>
          </div>
          <div className="px-6 py-8 sm:px-10 sm:py-10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <span className="badge bg-emerald-500/10 text-emerald-500 text-xs mb-3">Live session</span>
              <h3 className="text-lg font-bold text-primary mb-2">Take a history. Get scored.</h3>
              <p className="text-sm text-secondary leading-relaxed mb-4">
                You have 8 minutes. The patient presents with crushing central chest pain. Ask the right questions —
                the examiner is watching.
              </p>
              <div className="flex gap-2">
                <div className="glass-card py-1.5! px-3! text-center">
                  <span className="text-sm font-bold text-emerald-500 tabular-nums">8/10</span>
                  <p className="text-[10px] text-secondary">History</p>
                </div>
                <div className="glass-card py-1.5! px-3! text-center">
                  <span className="text-sm font-bold text-amber-500 tabular-nums">6/10</span>
                  <p className="text-[10px] text-secondary">Reasoning</p>
                </div>
                <div className="glass-card py-1.5! px-3! text-center">
                  <span className="text-sm font-bold text-violet-500 tabular-nums">7/10</span>
                  <p className="text-[10px] text-secondary">Communication</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg p-3" style={{ background: 'var(--subtle-bg)' }}>
                <p className="text-xs text-secondary mb-1 font-semibold">Patient</p>
                <p className="text-sm text-primary">&ldquo;It started about two hours ago... right here in the middle of my chest. Feels like something heavy sitting on me.&rdquo;</p>
              </div>
              <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
                <p className="text-xs text-emerald-500 mb-1 font-semibold">You</p>
                <p className="text-sm text-primary">&ldquo;Can you describe the pain — does it go anywhere else?&rdquo;</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--subtle-bg)' }}>
                <p className="text-xs text-secondary mb-1 font-semibold">Patient</p>
                <p className="text-sm text-primary">&ldquo;Yes, down my left arm and up into my jaw. That&apos;s what scared me.&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-5xl pb-32">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pick what you&apos;re working on</h2>
          <p className="mt-3 text-secondary max-w-lg mx-auto">Each module is built for one skill. Go deep, not wide.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className={`group glass-card flex flex-col transition-shadow duration-300 hover:shadow-xl ${p.glow}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${p.gradient} text-white shadow-lg`}>
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">{p.name}</h3>
                  <span className="text-xs text-secondary">{p.tag}</span>
                </div>
              </div>
              <p className="text-sm text-secondary leading-relaxed flex-1">{p.desc}</p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Launch
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Early adopters, real results</h2>
          <p className="mt-3 text-secondary max-w-md mx-auto">Feedback from students in our early access programme.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">{t.product}</span>
              </div>
              <p className="text-sm text-primary leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <p className="text-sm font-semibold text-primary">{t.name}</p>
                <p className="text-xs text-secondary">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl text-center pb-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your exam isn&apos;t going to wait.
        </h2>
        <p className="mt-3 text-secondary max-w-md mx-auto">
          Every day you don&apos;t practise is a day closer to the real thing without the reps.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth/sign-up" className="btn-primary px-6 py-3">
            Create free account
          </Link>
          <Link to="/pricing" className="btn-secondary px-6 py-3">
            See pricing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--card-border)' }}>
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 px-5">
          <p className="text-xs text-secondary">&copy; 2026 NovatePersona.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">Docs</a>
            <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-xs text-secondary hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
