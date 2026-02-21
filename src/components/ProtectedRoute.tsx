import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-in">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-200 dark:border-brand-800 border-t-brand-500" />
          <p className="text-sm text-secondary">Loading&hellip;</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  return <>{children}</>
}
