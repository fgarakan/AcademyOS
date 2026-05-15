'use client'

// Sprint 360 — Donna Version History Panel V1
// Read-only collapsible panel showing the draft's history array.
// Each entry shows what changed (field name + old → new value).
// No undo-to-version yet — display only.

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import type { DonnaDraftState, DraftSnapshot } from './donnaDraftRuntime'

interface Props {
  draft: DonnaDraftState
}

export function DonnaVersionHistoryPanel({ draft }: Props) {
  const [expanded, setExpanded] = useState(false)

  const { history } = draft
  if (history.length === 0) return null

  const changeCount = history.length

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
      >
        {expanded
          ? <ChevronUp className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3" />}
        {changeCount} change{changeCount !== 1 ? 's' : ''}
      </button>

      {expanded && (
        <div
          className="mt-2 rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="px-3 py-1.5 flex items-center gap-1.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Clock className="w-3 h-3 text-text-muted" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Version history
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* Most recent change first */}
            {[...history].reverse().map((snapshot: DraftSnapshot, revIdx) => {
              const version = history.length - revIdx
              // Compare with the snapshot before this one (or the empty state)
              const prevSnap = revIdx < history.length - 1 ? [...history].reverse()[revIdx + 1] : null

              // Compute changed fields: compare snapshot.fields with prevSnap.fields
              const changedFields: Array<{ fieldId: string; oldVal: string | null; newVal: string }> = []
              for (const [fieldId, entry] of Object.entries(snapshot.fields)) {
                const oldEntry = prevSnap?.fields[fieldId] ?? null
                const oldVal = oldEntry ? oldEntry.value : null
                if (oldVal !== entry.value) {
                  changedFields.push({ fieldId, oldVal, newVal: entry.value })
                }
              }

              return (
                <div key={snapshot.snapshotAt} className="px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-lime">v{version}</span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(snapshot.snapshotAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  {changedFields.length === 0 ? (
                    <p className="text-[10px] text-text-muted italic">No field changes detected.</p>
                  ) : (
                    changedFields.map(({ fieldId, oldVal, newVal }) => (
                      <div key={fieldId} className="text-[10px] leading-snug">
                        <span className="text-text-muted uppercase tracking-wide">
                          {fieldId.replace(/_/g, ' ')}:{' '}
                        </span>
                        {oldVal !== null && (
                          <>
                            <span className="text-status-red line-through">{oldVal}</span>
                            <span className="text-text-muted mx-1">→</span>
                          </>
                        )}
                        <span className="text-text-primary">{newVal}</span>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
