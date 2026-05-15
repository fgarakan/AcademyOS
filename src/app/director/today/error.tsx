'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function TodaysAcademyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-6 flex items-start justify-center min-h-[40vh]">
      <div className="max-w-md w-full bg-surface border border-status-red/20 rounded-2xl p-8 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-status-red/10 border border-status-red/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-status-red" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Today's Academy failed to load
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {error.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="btn-lime text-sm"
          >
            Try again
          </button>
          <Link href="/director" className="btn-ghost text-sm">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
