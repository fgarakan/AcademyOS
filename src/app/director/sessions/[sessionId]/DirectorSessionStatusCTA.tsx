'use client'

import { useState, useTransition } from 'react'
import { Play, Square, AlertCircle } from 'lucide-react'
import { updateSessionStatusAction } from './actions'

interface Props {
  sessionId: string
  initialStatus: string
}

export function DirectorSessionStatusCTA({ sessionId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (status !== 'planned' && status !== 'in_progress') return null

  function handleStatusChange(newStatus: 'in_progress' | 'completed') {
    setError(null)
    startTransition(async () => {
      const result = await updateSessionStatusAction({ sessionId, status: newStatus })
      if (result.ok) {
        setStatus(newStatus)
      } else {
        setError(result.error ?? 'Status update failed.')
      }
    })
  }

  return (
    <div className="space-y-2">
      {status === 'planned' && (
        <button
          type="button"
          onClick={() => handleStatusChange('in_progress')}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime/10 border border-lime/30 text-lime font-semibold text-sm hover:bg-lime/20 transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {isPending ? 'Starting…' : 'Start Session'}
        </button>
      )}
      {status === 'in_progress' && (
        <button
          type="button"
          onClick={() => handleStatusChange('completed')}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-status-green/10 border border-status-green/30 text-status-green font-semibold text-sm hover:bg-status-green/20 transition-colors disabled:opacity-50"
        >
          <Square className="w-4 h-4" />
          {isPending ? 'Ending…' : 'End Session'}
        </button>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-status-red">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
