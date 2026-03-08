import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import UserMenu from './components/UserMenu'
import ScrollToTop from './components/ScrollToTop'
import Logo from './components/Logo'
import Onboarding, { isOnboardedGlobal } from './components/Onboarding'
import { useTheme } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'

function lazyRetry(fn: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    fn().catch(() => {
      window.location.reload()
      return new Promise(() => {})
    })
  )
}

const Home = lazyRetry(() => import('./pages/Home'))
const Novatutor = lazyRetry(() => import('./pages/Novatutor'))
const NovateExaminer = lazyRetry(() => import('./pages/NovateExaminer'))
import NovaPatientScenarios from './pages/NovaPatientScenarios'
const NovaPatientChat = lazyRetry(() => import('./pages/NovaPatientChat'))
const Features = lazyRetry(() => import('./pages/Features'))
const Pricing = lazyRetry(() => import('./pages/Pricing'))
const About = lazyRetry(() => import('./pages/About'))
const SignIn = lazyRetry(() => import('./pages/auth/SignIn'))
const SignUp = lazyRetry(() => import('./pages/auth/SignUp'))
const ForgotPassword = lazyRetry(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazyRetry(() => import('./pages/auth/ResetPassword'))
const AuthCallback = lazyRetry(() => import('./pages/auth/AuthCallback'))
const Leaderboard = lazyRetry(() => import('./pages/Leaderboard'))
const Dashboard = lazyRetry(() => import('./pages/Dashboard'))

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
]

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="text-7xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-lg text-secondary">Page not found</p>
      <Link to="/" className="btn-primary mt-8">Back to Home</Link>
    </div>
  )
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isImmersive = location.pathname.includes('/chat') || location.pathname === '/novatutor' || location.pathname === '/novate-examiner' || location.pathname === '/nova-patient'
  const isAuthPage = location.pathname.startsWith('/auth')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (user && !isOnboardedGlobal()) {
      setShowOnboarding(true)
    }
  }, [user])

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />

      {showOnboarding && user && (
        <Onboarding
          userName={user.user_metadata?.full_name || user.email?.split('@')[0] || ''}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {!isImmersive && !isAuthPage && (
        <header
          className={`sticky top-0 z-50 transition-all duration-200 ${
            scrolled ? 'border-b shadow-sm' : 'border-b border-transparent'
          }`}
          style={{
            borderColor: scrolled ? 'var(--card-border)' : 'transparent',
            background: 'var(--nav-bg)',
            backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(0px)',
            WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(0px)',
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 h-16">
            <Logo size="sm" />

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }: { isActive: boolean }) =>
                    `relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150
                     ${isActive
                       ? 'text-primary'
                       : 'text-secondary hover:text-primary hover:bg-(--subtle-bg)'
                     }`
                  }
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-violet-500" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-(--subtle-bg)"
                style={{ color: 'var(--text-main)' }}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
              </button>

              {user ? (
                <UserMenu />
              ) : (
                <>
                  <Link
                    to="/auth/sign-in"
                    className="hidden sm:inline-flex btn-secondary text-sm px-4 py-2"
                  >
                    Sign in
                  </Link>
                  <Link to="/auth/sign-up" className="btn-primary text-sm px-4 py-2">
                    Get started
                  </Link>
                </>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-(--subtle-bg) md:hidden"
                style={{ color: 'var(--text-main)' }}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="border-t px-5 pb-4 pt-3 md:hidden animate-in" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }: { isActive: boolean }) =>
                      `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                       ${isActive
                         ? 'text-primary bg-(--subtle-bg)'
                         : 'text-secondary hover:text-primary hover:bg-(--subtle-bg)'
                       }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="border-t mt-2 pt-3 flex flex-col gap-2" style={{ borderColor: 'var(--card-border)' }}>
                  {user ? null : (
                    <>
                      <Link
                        to="/auth/sign-in"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn-secondary text-sm justify-center"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/auth/sign-up"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn-primary text-sm justify-center"
                      >
                        Get started free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>
          )}
        </header>
      )}

      <main className={`relative flex-1 ${isImmersive || isAuthPage ? '' : 'px-5 lg:px-8'}`}>
        <Suspense fallback={<div className="flex items-center justify-center py-32"><div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />

            {/* Auth */}
            <Route path="/auth/sign-in" element={<SignIn />} />
            <Route path="/auth/sign-up" element={<SignUp />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected */}
            <Route path="/novatutor" element={<ProtectedRoute><Novatutor /></ProtectedRoute>} />
            <Route path="/novate-examiner" element={<ProtectedRoute><NovateExaminer /></ProtectedRoute>} />
            <Route path="/nova-patient" element={<ProtectedRoute><NovaPatientScenarios /></ProtectedRoute>} />
            <Route path="/nova-patient/chat" element={<ProtectedRoute><NovaPatientChat /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
