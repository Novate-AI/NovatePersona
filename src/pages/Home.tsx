import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getPlatformStats, type PlatformStats } from '../lib/stats'
import WelcomeBack from '../components/WelcomeBack'

const SLIDES = [
  {
    id: 'tutor',
    role: 'Tutor',
    title: 'Meet your NovaTutor',
    desc: 'Speak freely in 10+ languages. Get corrected in real-time without the awkwardness.',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-400',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    link: '/novatutor',
    stat: { val: '10+', label: 'Languages' }
  },
  {
    id: 'examiner',
    role: 'Examiner',
    title: 'Meet your NovateExaminer',
    desc: 'Run full 3-part speaking mocks. Get band scores and feedback in seconds.',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-400',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    link: '/novate-examiner',
    stat: { val: 'Band 9', label: 'Standard' }
  },
  {
    id: 'patient',
    role: 'Patient',
    title: 'Meet your NovatePatient',
    desc: 'Take focused clinical histories. Get graded on the same 4 domains your examiner uses.',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-400',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    link: '/nova-patient',
    stat: { val: 'OSCE', label: 'Ready' }
  }
]

const testimonials = [
  {
    quote: "I used NovaPatient the week before my OSCE and scored Distinction on 4 out of 6 stations.",
    name: "Fatima A.",
    role: "3rd year medical student",
    product: 'NovaPatient',
  },
  {
    quote: "My IELTS speaking went from 6.0 to 7.5 in two months. I practised every morning before work.",
    name: "Carlos M.",
    role: "Software engineer",
    product: 'NovateExaminer',
  },
  {
    quote: "We rolled this out across our Year 3 cohort. Students who used it 3+ times a week scored 12% higher.",
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
  const [activeSlide, setActiveSlide] = useState(0)
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    getPlatformStats().then(setStats)
  }, [])

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative isolate overflow-hidden">
      {/* Welcome back nudge */}
      <div className="mx-auto max-w-3xl pt-6 px-1">
        <WelcomeBack />
      </div>

      {/* Hero Carousel */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          
          <div className="relative z-10">
            <div className="relative h-[600px] sm:h-[500px] transition-all duration-500">
              {SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlide
                const isPrev = idx === (activeSlide - 1 + SLIDES.length) % SLIDES.length
                const isNext = idx === (activeSlide + 1) % SLIDES.length
                
                let positionClass = 'opacity-0 scale-95 pointer-events-none absolute inset-0'
                if (isActive) positionClass = 'opacity-100 scale-100 z-20 relative'
                if (isPrev) positionClass = 'opacity-0 -translate-x-10 scale-95 absolute inset-0'
                if (isNext) positionClass = 'opacity-0 translate-x-10 scale-95 absolute inset-0'

                return (
                  <div key={slide.id} className={`transition-all duration-700 ease-in-out grid lg:grid-cols-2 gap-4 lg:gap-8 items-center ${positionClass}`}>
                    
                    {/* Text Side (Left) */}
                    <div className="text-center lg:text-left order-2 lg:order-1">
                      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary mb-6 leading-tight">
                        Meet your <span className={`text-transparent bg-clip-text bg-linear-to-r ${slide.gradient}`}>{slide.title.replace('Meet your ', '')}</span>
                      </h1>
                      
                      <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                        {slide.desc}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
                        <Link 
                          to={slide.link}
                          className={`px-8 py-3.5 text-base font-semibold shadow-lg shadow-${slide.color}-500/20 w-full sm:w-auto text-center rounded-lg text-white transition-all hover:opacity-90 ${
                          slide.id === 'tutor' ? 'bg-blue-600 hover:bg-blue-500' :
                          slide.id === 'examiner' ? 'bg-violet-600 hover:bg-violet-500' :
                          'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                        >
                          Try {slide.role} Now
                        </Link>
                        <Link to="/pricing" className="btn-secondary px-8 py-3.5 text-base font-semibold w-full sm:w-auto text-center">
                          View Pricing
                        </Link>
                      </div>
                    </div>

                    {/* Image Side (Right) */}
                    <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                      <div className={`relative w-full max-w-[320px] sm:max-w-md aspect-square lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-${slide.color}-500/30 transform transition-transform duration-700 ${isActive ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
                        <img 
                          src={slide.image} 
                          alt={slide.title}
                          className="w-full h-full object-cover object-top"
                        />
                        <div className={`absolute inset-0 bg-linear-to-tr ${slide.gradient} opacity-20 mix-blend-overlay`} />
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* Carousel Indicators (Centered below) */}
            <div className="flex justify-center gap-3 mt-4 lg:mt-0 lg:absolute lg:bottom-0 lg:left-0 lg:w-1/2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeSlide ? 'w-8 bg-primary' : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] opacity-30 blur-3xl rounded-full transition-colors duration-1000 bg-linear-to-r from-transparent via-(--glow-color) to-transparent" 
            style={{ 
              '--glow-color': activeSlide === 0 ? '#3b82f6' : activeSlide === 1 ? '#8b5cf6' : '#10b981' 
            } as React.CSSProperties} 
          />
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y bg-zinc-50/50 dark:bg-zinc-900/20 py-10" style={{ borderColor: 'var(--card-border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary tabular-nums">{stats ? formatStat(stats.totalUsers) : '—'}</p>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary tabular-nums">{stats ? formatStat(stats.totalSessions) : '—'}</p>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold mt-1">Sessions Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary tabular-nums">4.9/5</p>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold mt-1">Average Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary tabular-nums">24/7</p>
              <p className="text-xs uppercase tracking-wider text-secondary font-semibold mt-1">Always Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Painkillers */}
      <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Why choose NovatePersona?</h2>
          <p className="mt-4 text-secondary text-lg">Because standard practice methods are broken.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-8 group hover:border-blue-500/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">No more awkwardness</h3>
            <p className="text-secondary leading-relaxed">
              Practise difficult conversations or a new language without the fear of judgement. Make mistakes freely.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 group hover:border-violet-500/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Instant Feedback</h3>
            <p className="text-secondary leading-relaxed">
              Don't wait for a tutor's email. Get detailed feedback on grammar, pronunciation, and clinical skills instantly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 group hover:border-emerald-500/30 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Exam Conditions</h3>
            <p className="text-secondary leading-relaxed">
              Simulate the pressure of the real exam. Timers, strict grading criteria, and realistic scenarios.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-zinc-50/50 dark:bg-zinc-900/20 border-y" style={{ borderColor: 'var(--card-border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Real students, real results</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card p-8 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-lg text-primary leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-secondary">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-primary">{t.name}</div>
                    <div className="text-xs text-secondary">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-6">
          Ready to practice?
        </h2>
        <p className="text-lg text-secondary max-w-2xl mx-auto mb-10">
          Join thousands of students practising smarter, not harder.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth/sign-up" className="btn-primary px-8 py-4 text-lg w-full sm:w-auto">
            Start Free Trial
          </Link>
          <Link to="/pricing" className="btn-secondary px-8 py-4 text-lg w-full sm:w-auto">
            View Plans
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: 'var(--card-border)' }}>
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">NovatePersona</span>
            <span className="text-xs text-secondary">&copy; 2026</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-secondary hover:text-primary transition-colors">Docs</a>
            <a href="#" className="text-sm text-secondary hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm text-secondary hover:text-primary transition-colors">Terms</a>
            <a href="mailto:team@mynovateai.com" className="text-sm text-secondary hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
