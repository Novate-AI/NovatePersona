export default function About() {
  const values = [
    {
      title: 'Privacy First',
      desc: 'Your sessions are yours. Encrypted, private, and never shared. We believe training data is personal — full stop.',
      icon: '🔒',
    },
    {
      title: 'Real-World Fidelity',
      desc: 'A simulator is only useful if it feels real. Our practice partners capture emotional cues, hesitations, and natural speech patterns.',
      icon: '🎯',
    },
    {
      title: 'Accessible to Everyone',
      desc: 'Mastering a skill shouldn\'t depend on geography or budget. High-quality training for anyone with a browser.',
      icon: '🌍',
    },
  ]

  const team = [
    { role: 'Medicine', detail: 'Scenarios reviewed by practising clinicians and OSCE examiners' },
    { role: 'Linguistics', detail: 'IELTS frameworks validated against Cambridge scoring rubrics' },
    { role: 'Engineering', detail: 'Built for speed — sub-second response times, works on any device' },
  ]

  return (
    <div className="max-w-4xl mx-auto py-16 sm:py-24 animate-in">
      <div className="mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          Why we built this
        </h1>
        <div className="mt-6 space-y-4 text-base sm:text-lg text-secondary leading-relaxed max-w-2xl">
          <p>
            Every medical student, language learner, and IELTS candidate hits the same wall: 
            you need practice, but human tutors are expensive, hard to schedule, and sometimes judgmental.
          </p>
          <p>
            We built Novate Persona to remove that barrier. Unlimited practice sessions, 
            instant feedback, available 24/7. No booking. No waiting. No awkwardness.
          </p>
          <p>
            The practice partners feel real because they&apos;re built on real clinical data, 
            real exam frameworks, and real conversational patterns — not generic chatbots.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What we stand for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {values.map((v) => (
            <div key={v.title} className="glass-card">
              <span className="text-2xl mb-3 block">{v.icon}</span>
              <h3 className="text-sm font-bold text-primary mb-2">{v.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Built by */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-primary mb-6">Built by people who care about accuracy</h2>
        <div className="space-y-3">
          {team.map((t) => (
            <div key={t.role} className="glass-card flex items-start gap-4 py-4!">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">{t.role}</h3>
                <p className="text-sm text-secondary">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card text-center py-8">
        <p className="text-lg font-bold text-primary mb-2">
          &ldquo;Training should be as fluid as conversation itself.&rdquo;
        </p>
        <p className="text-sm text-secondary">That&apos;s the vision behind Novate.</p>
      </div>
    </div>
  )
}
