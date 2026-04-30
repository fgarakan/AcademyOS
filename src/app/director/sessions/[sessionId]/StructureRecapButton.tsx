'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { structureSessionRecapAction } from './structureRecapAction'

interface Props {
  voiceNoteId: string
  sessionId: string
}

export function StructureRecapButton({ voiceNoteId, sessionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await structureSessionRecapAction(voiceNoteId, sessionId)
      if (result.ok) {
        setDone(true)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  if (done) {
    return (
      <p className="text-xs text-status-green">Structured draft created — see below.</p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Sparkles className="w-3.5 h-3.5" />
        }
        {isPending ? 'Structuring…' : 'Create Structured Draft'}
      </button>
      {error && <p className="text-xs text-status-red">{error}</p>}
    </div>
  )
}
