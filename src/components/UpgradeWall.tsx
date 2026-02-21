import { Link } from 'react-router-dom'
import { FREE_LIMIT } from '../lib/subscription'

interface UpgradeWallProps {
  onClose: () => void
  sessionsUsed: number
}

export default function UpgradeWall({ onClose, sessionsUsed }: UpgradeWallProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-card max-w-md w-full text-center animate-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 mb-4">
            <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary">Daily limit reached</h2>
          <p className="text-sm text-secondary mt-2">
            You&apos;ve used all {FREE_LIMIT} free sessions today ({sessionsUsed}/{FREE_LIMIT}).
            Upgrade to Pro for unlimited practice.
          </p>
        </div>

        {/* What you get */}
        <div className="text-left mb-6 space-y-2">
          {[
            'Unlimited sessions, every day',
            'Smart recommendations based on your weak areas',
            'Full domain score breakdown',
            'Streak tracking to build habits',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-sm text-primary">{f}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Link
            to="/pricing"
            className="btn-primary w-full py-3 text-sm justify-center"
            onClick={onClose}
          >
            Upgrade to Pro — $12/mo
          </Link>
          <p className="text-xs text-secondary">7-day free trial. Cancel anytime.</p>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-xs text-secondary">
            Your {FREE_LIMIT} free sessions reset at midnight. Come back tomorrow or upgrade now.
          </p>
        </div>
      </div>
    </div>
  )
}
