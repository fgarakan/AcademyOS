'use client'

import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function TodaysAcademyError({
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
        <p className="text-base font-semibold text-text-primary">Today's Academy failed to load</p>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          {error.message || 'Could not load today\'s academy view. Try again or return to the dashboard.'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sm text-text-secondary hover:text-text-primary hover:border-lime/30 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
        <Link href="/director" className="btn-ghost text-sm">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
