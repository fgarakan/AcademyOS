'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle, CheckSquare, Square, X } from 'lucide-react'
import { VoiceIntakeDraftCard } from './VoiceIntakeDraftCard'
import type { EnrichedVoiceIntakeDraftItem } from './VoiceIntakeDraftCard'
import { batchDismissVoiceIntakeAction } from './batchReviewActions'

interface Props {
  pending: EnrichedVoiceIntakeDraftItem[]
}

export function VoiceIntakeBatchPanel({ pending }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const visible = pending.filter(d => !dismissed.has(d.id))

  function toggleAll() {
    if (selected.size === visible.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visible.map(d => d.id)))
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    setError(null)
    setResult(null)
    const ids = Array.from(selected)
    startTransition(async () => {
      const res = await batchDismissVoiceIntakeAction(ids)
      if (res.ok) {
        setDismissed(prev => {
          const next = new Set(prev)
          ids.forEach(id => next.add(id))
          return next
        })
        setSelected(new Set())
        setConfirming(false)
        setResult(`${res.dismissed} item${res.dismissed !== 1 ? 's' : ''} dismissed.`)
      } else {
        setError(res.error ?? 'Batch dismiss failed.')
        setConfirming(false)
      }
    })
  }

  if (visible.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Batch controls bar */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {selected.size === visible.length && visible.length > 0
            ? <CheckSquare className="w-3.5 h-3.5 text-lime" />
            : <Square className="w-3.5 h-3.5" />
          }
          {selected.size === visible.length && visible.length > 0 ? 'Deselect all' : 'Select all'}
        </button>

        {selected.size > 0 && (
          <button
            onClick={() => { setConfirming(true); setError(null); setResult(null) }}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-status-red/10 text-status-red border border-status-red/30 hover:bg-status-red/20 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Dismiss {selected.size} selected
          </button>
        )}

        {result && (
          <span className="text-xs text-status-green flex items-center gap-1">
            <CheckSquare className="w-3 h-3" />
            {result}
          </span>
        )}
        {error && (
          <span className="text-xs text-status-red flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>

      {/* Confirmation modal */}
      {confirming && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-status-red/5 border border-status-red/20">
          <AlertTriangle className="w-4 h-4 text-status-red shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              Dismiss {selected.size} voice intake {selected.size === 1 ? 'item' : 'items'}?
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              These will be marked dismissed and removed from the queue. This cannot be undone.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-status-red/10 text-status-red border border-status-red/30 hover:bg-status-red/20 transition-colors"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                {isPending ? 'Dismissing…' : 'Confirm dismiss'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-lg text-text-muted border border-border hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          <button onClick={() => setConfirming(false)} className="shrink-0 text-text-muted hover:text-text-secondary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Individual draft cards with checkboxes */}
      <div className="space-y-4">
        {visible.map(draft => (
          <div key={draft.id} className="flex items-start gap-3">
            <button
              onClick={() => toggle(draft.id)}
              className="mt-4 shrink-0 text-text-muted hover:text-lime transition-colors"
              aria-label={selected.has(draft.id) ? 'Deselect' : 'Select'}
            >
              {selected.has(draft.id)
                ? <CheckSquare className="w-4 h-4 text-lime" />
                : <Square className="w-4 h-4" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <VoiceIntakeDraftCard draft={draft} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
