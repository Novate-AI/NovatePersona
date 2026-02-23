import { useState } from 'react'
import { Link } from 'react-router-dom'

const ONBOARDING_KEY = 'nv_onboarded'

export function isOnboardedGlobal(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

function markOnboarded(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

const GOALS = [
  { id: 'osce', label: 'Pass my OSCE', icon: '🩺', path: '/nova-patient', desc: 'Clinical history-taking practice' },
  { id: 'ielts', label: 'Ace IELTS speaking', icon: '🎓', path: '/novate-examiner', desc: 'Full 3-part mock exams' },
  { id: 'language', label: 'Learn a language', icon: '🗣️', path: '/novatutor', desc: '10+ languages, real-time corrections' },
  { id: 'explore', label: 'Just exploring', icon: '👀', path: '/dashboard', desc: 'Take a look around' },
]

interface OnboardingProps {
  userName: string
  onComplete: () => void
}

export default function Onboarding({ userName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const firstName = userName.split(' ')[0] || 'there'

  function finish() {
    markOnboarded()
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-card max-w-md w-full animate-in relative overflow-hidden">

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-emerald-500' : ''}`}
              style={i > step ? { background: 'var(--subtle-bg)' } : undefined} />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center">
            <span className="text-4xl mb-4 block">👋</span>
            <h2 className="text-xl font-bold text-primary mb-2">Welcome, {firstName}!</h2>
            <p className="text-sm text-secondary leading-relaxed mb-6">
              NovatePersona gives you unlimited practice sessions for clinical exams, IELTS speaking, and language learning.
              Let&apos;s get you set up in 30 seconds.
            </p>
            <button onClick={() => setStep(1)} className="btn-primary px-8 py-2.5 text-sm">
              Let&apos;s go
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-1">What brings you here?</h2>
            <p className="text-sm text-secondary mb-5">Pick your main goal — you can always switch later.</p>
            <div className="space-y-2">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoal(g.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                    selectedGoal === g.id
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'hover:border-emerald-500/30'
                  }`}
                  style={selectedGoal !== g.id ? { borderColor: 'var(--card-border)', background: 'var(--card-bg)' } : undefined}
                >
                  <span className="text-xl">{g.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">{g.label}</p>
                    <p className="text-xs text-secondary">{g.desc}</p>
                  </div>
                  {selectedGoal === g.id && (
                    <svg className="h-5 w-5 text-emerald-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedGoal}
              className="btn-primary w-full mt-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <span className="text-4xl mb-4 block">🚀</span>
            <h2 className="text-lg font-bold text-primary mb-2">You&apos;re all set!</h2>
            <p className="text-sm text-secondary leading-relaxed mb-2">
              You get <strong className="text-primary">3 free sessions total</strong>. 
              Upgrade anytime for unlimited access.
            </p>
            <div className="glass-card py-3! px-4! my-5 text-left">
              <div className="flex items-center gap-2 text-sm text-secondary mb-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Sessions are scored instantly
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary mb-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Progress syncs across devices
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Smart recommendations adapt to you
              </div>
            </div>
            {selectedGoal && (
              <Link
                to={GOALS.find(g => g.id === selectedGoal)?.path || '/'}
                onClick={finish}
                className="btn-primary w-full py-2.5 text-sm inline-flex justify-center"
              >
                Start my first session
              </Link>
            )}
            <button onClick={finish} className="block w-full text-center text-xs text-secondary mt-3 hover:text-primary transition-colors">
              I&apos;ll explore on my own
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
