'use client'

export default function LevelUpError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-text-secondary text-sm">Failed to load level readiness data.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-lime text-sm">
          Retry
        </button>
        <a href="/director" className="btn-ghost text-sm">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
