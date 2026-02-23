import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Natural Voice',
    description: 'Conversations feel human — with emotional cues, natural pauses, and real intonations. Not a robotic reading.',
    icon: (
      <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'Instant Feedback',
    description: 'Get scored the moment you finish. Band scores, domain breakdowns, strengths, and areas to improve — no waiting.',
    icon: (
      <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Private & Secure',
    description: 'Your sessions are encrypted end-to-end. Nobody listens, nobody stores your recordings. Practice without performance anxiety.',
    icon: (
      <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Smart Adaptation',
    description: 'The system tracks your weak areas and recommends scenarios that target exactly what you need to improve.',
    icon: (
      <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const products = [
  {
    to: '/novatutor',
    name: 'Novatutor',
    tagline: 'Language Practice',
    desc: 'Speak freely in 10+ languages. Real-time corrections, native-like flow, zero judgement.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    to: '/novate-examiner',
    name: 'NovateExaminer',
    tagline: 'Speaking Exam Prep',
    desc: 'Full 3-part mock tests with band scoring and targeted feedback. Run them as many times as you need.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    to: '/nova-patient',
    name: 'NovaPatient',
    tagline: 'Clinical Simulator',
    desc: 'Take focused histories from realistic patients under exam conditions. Graded on the 4 domains your examiner uses.',
    color: 'from-emerald-500 to-teal-500',
  },
]

export default function Features() {
  return (
    <div className="max-w-5xl mx-auto py-16 sm:py-24 animate-in">
      <div className="text-center mb-16">
        <span className="text-sm font-semibold text-brand-500 uppercase tracking-widest">How it works</span>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          Everything you need for oral mastery
        </h1>
        <p className="mt-4 text-secondary max-w-lg mx-auto">
          Pick a skill, start a session, get scored. Repeat until it&apos;s second nature.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
        {features.map((f) => (
          <div key={f.title} className="glass-card">
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-sm font-bold text-primary mb-2">{f.title}</h3>
            <p className="text-sm text-secondary leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          Specialised practice partners
        </h2>
        <p className="mt-3 text-secondary max-w-md mx-auto">
          Each module is built for one skill. Go deep, not wide.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {products.map((p) => (
          <div key={p.to} className="glass-card flex flex-col">
            <div className={`h-1.5 w-16 rounded-full bg-linear-to-r ${p.color} mb-5`} />
            <h3 className="text-lg font-bold text-primary">{p.name}</h3>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mt-1">{p.tagline}</p>
            <p className="text-sm text-secondary leading-relaxed mt-3 flex-1">{p.desc}</p>
            <Link
              to={p.to}
              className="mt-5 text-sm font-semibold text-brand-500 hover:text-brand-400 flex items-center gap-1.5 transition-colors"
            >
              Try it now
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
