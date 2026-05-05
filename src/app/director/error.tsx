'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

export default function DirectorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <div className="w-12 h-12 rounded-full bg-status-red/10 border border-status-red/30 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-status-red" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-text-primary">Something went wrong</p>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          {error.message || 'An unexpected error occurred in the director view.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sm text-text-secondary hover:text-text-primary hover:border-lime/30 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Try again
      </button>
    </div>
  )
}
