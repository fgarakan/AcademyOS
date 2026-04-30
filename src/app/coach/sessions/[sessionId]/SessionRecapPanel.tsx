'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import type { SaveSessionRecapInput, SaveSessionRecapResult } from './actions'

interface Props {
  sessionId: string
  sessionName: string
  completedCount: number
  totalCount: number
  attendanceSummary: string | null
  initialRecap: string
  saveRecapAction: (input: SaveSessionRecapInput) => Promise<SaveSessionRecapResult>
}

export function SessionRecapPanel({
  sessionId,
  sessionName,
  completedCount,
  totalCount,
  attendanceSummary,
  initialRecap,
  saveRecapAction,
}: Props) {
  const [recapText, setRecapText] = useState(initialRecap)
  const [result, setResult] = useState<SaveSessionRecapResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setResult(null)
    startTransition(async () => {
      const res = await saveRecapAction({ sessionId, recapText })
      setResult(res)
    })
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeader title="SESSION RECAP" />
        <p className="text-xs text-text-muted mt-1">
          Voice capture will be added later. For now, type the recap the same way you would say it after class.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Lightweight session context */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted pb-1">
          <span>Session: <span className="text-text-secondary">{sessionName}</span></span>
          {totalCount > 0 && (
            <span>Exercises: <span className="font-mono text-lime">{completedCount}/{totalCount} completed</span></span>
          )}
          {attendanceSummary && (
            <span>Attendance: <span className="text-text-secondary">{attendanceSummary}</span></span>
          )}
        </div>

        <textarea
          value={recapText}
          onChange={e => { setRecapText(e.target.value); setResult(null) }}
          placeholder="Example: Sarah was absent. Maria was present. We skipped the speed block and spent extra time on forehand grip and preparation. Maria improved when cued to set the racket earlier."
          rows={5}
          maxLength={5000}
          className="w-full text-sm bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50 transition-colors"
        />

        <p className="text-[10px] text-text-muted text-right">{recapText.length}/5,000</p>

        {result && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs ${
            result.ok
              ? 'bg-status-green/10 border border-status-green/30 text-status-green'
              : 'bg-status-red/10 border border-status-red/30 text-status-red'
          }`}>
            {result.ok ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span>
              {result.ok
                ? 'Recap saved. Next sprint will structure this into attendance context, session actuals, player observations, and director updates for review.'
                : (result.error ?? 'Unknown error.')}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !recapText.trim()}
          className="w-full btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save Recap'}
        </button>
      </CardContent>
    </Card>
  )
}
