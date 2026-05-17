'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { updatePlayerDevelopmentIntakeAction } from './developmentIntakeActions'
import type { DevelopmentIntakeValues } from './developmentIntakeActions'

export interface IntakePlayerRow {
  playerId: string
  fullName: string
  strengths: string[]
  needs: string[]
  currentPriority: string | null
  coachNotes: string | null
  hasDevelopmentData: boolean
}

interface PlayerCardProps {
  player: IntakePlayerRow
}

function TagInput({
  label,
  values,
  onChange,
  max,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  max: number
  placeholder: string
}) {
  const padded = [...values, ...Array(max - values.length).fill('')].slice(0, max)

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <div className="space-y-1">
        {padded.map((v, i) => (
          <input
            key={i}
            type="text"
            value={v}
            onChange={e => {
              const next = [...padded]
              next[i] = e.target.value
              onChange(next.filter(s => s.trim().length > 0))
            }}
            placeholder={i === 0 ? placeholder : `${label.toLowerCase().replace(/[^a-z ]/g, '')} ${i + 1} (optional)`}
            className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-lime/40 transition-colors"
          />
        ))}
      </div>
    </div>
  )
}

function PlayerIntakeCard({ player }: PlayerCardProps) {
  const [expanded, setExpanded] = useState(!player.hasDevelopmentData)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [strengths, setStrengths] = useState<string[]>(player.strengths)
  const [needs, setNeeds] = useState<string[]>(player.needs)
  const [priority, setPriority] = useState(player.currentPriority ?? '')
  const [notes, setNotes] = useState(player.coachNotes ?? '')

  function handleSave() {
    setSaved(false)
    setError(null)
    const values: DevelopmentIntakeValues = {
      strengths: strengths.filter(s => s.trim()),
      needs: needs.filter(n => n.trim()),
      currentPriority: priority.trim() || null,
      coachNotes: notes.trim() || null,
    }
    startTransition(async () => {
      const result = await updatePlayerDevelopmentIntakeAction(player.playerId, values)
      if (!result.ok) {
        setError(result.error ?? 'Save failed.')
      } else {
        setSaved(true)
        setExpanded(false)
      }
    })
  }

  return (
    <div className={`rounded-xl border bg-surface-raised transition-colors ${saved ? 'border-status-green/40' : 'border-border'}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} development intake for ${player.fullName}`}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/60 transition-colors"
        onClick={() => setExpanded(v => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v) } }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{player.fullName}</p>
          {!expanded && (
            <div className="flex gap-3 mt-0.5">
              {strengths.length > 0 ? (
                <p className="text-[10px] text-text-muted truncate">
                  {strengths.length} strength{strengths.length > 1 ? 's' : ''} · {needs.length} need{needs.length !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-[10px] text-status-orange">No development data yet</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <CheckCircle2 className="w-4 h-4 text-status-green" />}
          {!player.hasDevelopmentData && !saved && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
              Empty
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-text-muted" />
            : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border bg-surface/30">
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TagInput
              label="Strengths"
              values={strengths}
              onChange={setStrengths}
              max={3}
              placeholder="e.g. Consistent groundstrokes"
            />
            <TagInput
              label="Development Areas"
              values={needs}
              onChange={setNeeds}
              max={3}
              placeholder="e.g. Return of serve"
            />
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Current Priority</p>
            <input
              type="text"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              placeholder="The main focus for this player right now…"
              maxLength={200}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Coach Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Brief internal notes — not visible to players or parents."
              maxLength={500}
              rows={2}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-lime/40 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-status-red">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}

export function DevelopmentIntakeClient({ players }: { players: IntakePlayerRow[] }) {
  const [filter, setFilter] = useState<'all' | 'empty'>('all')

  const filtered = filter === 'empty'
    ? players.filter(p => !p.hasDevelopmentData)
    : players

  const emptyCount = players.filter(p => !p.hasDevelopmentData).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === 'all' ? 'border-lime text-lime' : 'border-border text-text-muted hover:text-text-secondary'}`}
        >
          All Players ({players.length})
        </button>
        {emptyCount > 0 && (
          <button
            type="button"
            aria-pressed={filter === 'empty'}
            onClick={() => setFilter('empty')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === 'empty' ? 'border-status-orange text-status-orange' : 'border-border text-text-muted hover:text-text-secondary'}`}
          >
            Missing Data ({emptyCount})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-primary font-medium">All players have development data</p>
          <p className="text-xs text-text-muted mt-1">Coach class intelligence and adaptive suggestions are ready.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PlayerIntakeCard key={p.playerId} player={p} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-muted pt-2">
        Strengths and needs feed into Class Roster Intelligence and Adaptive Session Suggestions. Not visible to players or parents.
      </p>
    </div>
  )
}
