import { Component, type ReactNode } from 'react'
import { captureError } from '../lib/errorTracking'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, { componentStack: info.componentStack || '' })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-main)' }}>
          <div className="max-w-md w-full text-center">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h1 className="text-2xl font-bold text-primary mb-2">Something went wrong</h1>
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              An unexpected error occurred. This has been reported automatically.
              Try refreshing the page, or go back to the home page.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-secondary cursor-pointer hover:text-primary transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs text-red-500/80 bg-red-500/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary px-5 py-2.5 text-sm"
              >
                Refresh page
              </button>
              <button
                onClick={this.handleReset}
                className="btn-primary px-5 py-2.5 text-sm"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
