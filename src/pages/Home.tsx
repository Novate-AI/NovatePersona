import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getPlatformStats, type PlatformStats } from '../lib/stats'
import WelcomeBack from '../components/WelcomeBack'

/* ─── Data ─────────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 'tutor',
    label: 'Language Practice',
    title: 'NovaTutor',
    heroWord: 'Tutor',
    tagline: 'Speak any language without the cringe.',
    desc: 'Real-time corrections, 10+ languages, CEFR-aligned feedback. No awkward silences. No judgement.',
    link: '/novatutor',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    accent: '#2563eb',
    accentLight: 'rgba(37,99,235,0.08)',
    stat: { value: '10+', label: 'Languages' },
    bullets: ['Live voice corrections', 'CEFR A1–C2 levels', '10+ language pairs'],
  },
  {
    id: 'examiner',
    label: 'IELTS Speaking',
    title: 'NovateExaminer',
    heroWord: 'Examiner',
    tagline: 'Your personal Band 9 examiner. Available 24/7.',
    desc: 'Full 3-part speaking mocks. Band scores. Detailed feedback within seconds of finishing.',
    link: '/novate-examiner',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
    accent: '#7c3aed',
    accentLight: 'rgba(124,58,237,0.08)',
    stat: { value: 'Band 9', label: 'Standard' },
    bullets: ['Parts 1, 2 & 3 format', 'Instant band scores', 'Pronunciation feedback'],
  },
  {
    id: 'patient',
    label: 'Clinical OSCE',
    title: 'NovatePatient',
    heroWord: 'Patient',
    tagline: 'Practice clinical histories without risking real patients.',
    desc: 'Lifelike patient simulations graded on the same 4 domains your examiner uses on exam day.',
    link: '/nova-patient',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    accent: '#059669',
    accentLight: 'rgba(5,150,105,0.08)',
    stat: { value: 'OSCE', label: 'Ready' },
    bullets: ['20+ clinical scenarios', 'Graded on 4 domains', 'Exam-condition timer'],
  },
]

const TESTIMONIALS = [
  {
    quote: "I practised with NovaPatient every evening the week before my OSCE. Distinction on 4 out of 6 stations.",
    name: "Fatima A.",
    role: "3rd year medical student",
    product: 'NovaPatient',
    initial: 'F',
    color: '#059669',
  },
  {
    quote: "IELTS speaking went from 6.0 to 7.5 in two months. The examiner feedback is genuinely accurate.",
    name: "Carlos M.",
    role: "Software engineer",
    product: 'NovateExaminer',
    initial: 'C',
    color: '#7c3aed',
  },
  {
    quote: "Rolled this out across our Year 3 cohort. Students who used it 3× a week scored 12% higher on average.",
    name: "Dr. Sarah Chen",
    role: "Clinical Skills Lead, UCL",
    product: 'Institution',
    initial: 'S',
    color: '#2563eb',
  },
]

const WHY = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
    title: 'Speak freely',
    body: 'No judgement, no embarrassment. Make every mistake you need to make, safely.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: 'Feedback in seconds',
    body: "Don't wait for a tutor's email. Get detailed, structured feedback the moment you finish.",
    accent: '#2563eb',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Exam conditions',
    body: 'Real timers, strict grading criteria, and realistic scenarios designed around actual exam frameworks.',
    accent: '#059669',
  },
]

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`
  if (n > 0) return `${n}+`
  return '—'
}

const SLIDE_DURATION = 4000 // ms per slide

/* ─── Component ────────────────────────────────────────── */
export default function Home() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [activeProduct, setActiveProduct] = useState(0)
  const [progress, setProgress] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  const stopAutoPlay = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const startAutoPlay = useCallback(() => {
    stopAutoPlay()
    startTimeRef.current = Date.now()
    setProgress(0)

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = (elapsed / SLIDE_DURATION) * 100

      if (pct >= 100) {
        setActiveProduct((prev) => (prev + 1) % PRODUCTS.length)
        startTimeRef.current = Date.now()
        setProgress(0)
      } else {
        setProgress(pct)
      }
    }, 50)
  }, [stopAutoPlay])

  useEffect(() => {
    getPlatformStats().then(setStats)
    startAutoPlay()
    return stopAutoPlay
  }, [startAutoPlay, stopAutoPlay])

  const handleSelectProduct = useCallback((i: number) => {
    setActiveProduct(i)
    startAutoPlay()
  }, [startAutoPlay])

  const active = PRODUCTS[activeProduct]

  return (
    <div className="relative isolate">
      {/* Welcome back nudge */}
      <div className="mx-auto max-w-3xl pt-4 px-4">
        <WelcomeBack />
      </div>

      {/* ── HERO CAROUSEL ─────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: 'calc(100vh - 56px)', minHeight: '600px', maxHeight: '900px' }}>
        {/* Slides */}
        {PRODUCTS.map((p, i) => (
          <div
            key={p.id}
            className="absolute inset-0 transition-all duration-700"
            style={{
              opacity: i === activeProduct ? 1 : 0,
              transform: i === activeProduct ? 'scale(1)' : 'scale(1.03)',
              pointerEvents: i === activeProduct ? 'auto' : 'none',
            }}
          >
            {/* Full-bleed background image */}
            <img
              src={p.image}
              alt={p.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Dark gradient overlays */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.2) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
            {/* Accent colour tint */}
            <div className="absolute inset-0 transition-colors duration-700" style={{ background: `${p.accent}18` }} />
          </div>
        ))}

        {/* Slide content */}
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
          <div
            key={active.id}
            className="animate-in max-w-2xl"
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <span
                className="h-px flex-1 max-w-[40px]"
                style={{ background: active.accent }}
              />
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: active.accent }}
              >
                {active.label}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white mb-5">
              Meet<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, #fff 30%, ${active.accent})` }}
              >
                {active.title}
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-xl sm:text-2xl font-medium text-white/80 mb-4 leading-snug">
              {active.tagline}
            </p>

            {/* Description */}
            <p className="text-base text-white/60 mb-8 max-w-lg leading-relaxed">
              {active.desc}
            </p>

            {/* Bullets */}
            <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-10">
              {active.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: active.accent }} />
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                to={active.link}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:gap-3"
                style={{ background: active.accent, boxShadow: `0 4px 24px -6px ${active.accent}88` }}
              >
                Try {active.title}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/auth/sign-up"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Start for free
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom nav bar ─ */}
        <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-12 lg:px-20 pb-8 max-w-7xl mx-auto">
          <div className="flex items-end justify-between">
            {/* Product tabs */}
            <div className="flex items-center gap-1">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(i)}
                  className="group flex flex-col gap-1.5 px-4 py-2 rounded-lg transition-all focus:outline-none"
                  style={{ background: i === activeProduct ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                >
                  <span
                    className="text-xs font-bold transition-colors"
                    style={{ color: i === activeProduct ? 'white' : 'rgba(255,255,255,0.4)' }}
                  >
                    {p.title}
                  </span>
                  {/* Progress bar */}
                  <span className="relative h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {i === activeProduct && (
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${progress}%`, background: p.accent, transition: 'width 0.03s linear' }}
                      />
                    )}
                    {i !== activeProduct && (
                      <span className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Arrow controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectProduct((activeProduct - 1 + PRODUCTS.length) % PRODUCTS.length)}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                aria-label="Previous"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => handleSelectProduct((activeProduct + 1) % PRODUCTS.length)}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                aria-label="Next"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section className="border-y py-10" style={{ borderColor: 'var(--card-border)', background: 'var(--bg-subtle)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats ? formatStat(stats.totalUsers) : '—', label: 'Active students' },
              { value: stats ? formatStat(stats.totalSessions) : '—', label: 'Sessions completed' },
              { value: stats ? `${stats.weeklyActive}+` : '—', label: 'Active this week' },
              { value: '24/7', label: 'Always available' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-strong)' }}>{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-1.5" style={{ color: 'var(--text-main)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ───────────────────────────────────────────── */}
      <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Why it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-strong)' }}>
            Standard practice is broken.
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: 'var(--text-main)' }}>
            Tutors are expensive. Group classes are slow. YouTube videos don't talk back.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="glass-card p-8 group hover:shadow-lg transition-all duration-200"
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-6 transition-transform duration-200 group-hover:scale-105"
                style={{ background: `${w.accent}15`, color: w.accent }}
              >
                {w.icon}
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-strong)' }}>{w.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-main)' }}>{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section
        className="py-24 border-y"
        style={{ borderColor: 'var(--card-border)', background: 'var(--bg-subtle)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Early adopters</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-strong)' }}>
              Real students, real results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card p-8 flex flex-col hover:shadow-md transition-all duration-200">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-[15px] leading-relaxed flex-1 mb-6" style={{ color: 'var(--text-strong)' }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: t.color }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-main)' }}>{t.role}</div>
                  </div>
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${t.color}18`, color: t.color }}
                  >
                    {t.product}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-28 text-center px-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 100%, rgba(124,58,237,0.07), transparent)' }} />
        <p className="section-label mb-4">Get started</p>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5" style={{ color: 'var(--text-strong)' }}>
          Three free sessions.<br />No credit card.
        </h2>
        <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: 'var(--text-main)' }}>
          See exactly what you're getting before you pay a penny. Most students know within the first session.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/auth/sign-up" className="btn-primary px-10 py-4 text-base w-full sm:w-auto">
            Start free — no card needed
          </Link>
          <Link to="/pricing" className="btn-secondary px-10 py-4 text-base w-full sm:w-auto">
            See pricing
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t py-12" style={{ borderColor: 'var(--card-border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: 'var(--text-strong)' }}>NovatePersona</span>
              <span className="text-xs" style={{ color: 'var(--text-main)' }}>&copy; 2026</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/features" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--text-main)' }}>Features</Link>
              <Link to="/pricing" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--text-main)' }}>Pricing</Link>
              <Link to="/about" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--text-main)' }}>About</Link>
              <a href="mailto:team@mynovateai.com" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--text-main)' }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
