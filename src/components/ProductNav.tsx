import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PRODUCTS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/novatutor', label: 'Novatutor', icon: '🗣️', desc: 'Language practice' },
  { path: '/novate-examiner', label: 'NovateExaminer', icon: '🎓', desc: 'Speaking mock exams' },
  { path: '/nova-patient', label: 'NovaPatient', icon: '🩺', desc: 'OSCE consultation' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Your progress' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆', desc: 'Top practitioners' },
]

export default function ProductNav({ current }: { current: string }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
      >
        {current}
        <svg className={`h-3 w-3 text-secondary transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border shadow-xl z-50 overflow-hidden animate-slide-up"
          style={{ borderColor: 'var(--card-border)', background: 'var(--bg-main)' }}>
          {PRODUCTS.map(p => {
            const isActive = location.pathname === p.path || (p.path !== '/' && location.pathname.startsWith(p.path))
            return (
              <Link
                key={p.path}
                to={p.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 text-primary font-semibold'
                    : 'text-secondary hover:text-primary hover:bg-(--subtle-bg)'
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <div>
                  <p className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{p.label}</p>
                  {p.desc && <p className="text-[11px] text-secondary">{p.desc}</p>}
                </div>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </Link>
            )
          })}

          {user && (
            <>
              <div className="border-t" style={{ borderColor: 'var(--card-border)' }} />
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-medium text-primary truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                  <p className="text-[11px] text-secondary truncate">{user.email}</p>
                </div>
                <button
                  onClick={async () => { setOpen(false); await signOut() }}
                  className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors ml-3"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
