'use client'

// Sprint 586 — Coach Attendance Exception UX V1
// Coach-friendly attendance exception capture supporting natural language patterns.
// Drafts only — no official attendance writes from this component.
// Unrostered players become director review items (no roster change until approved).

import { useState } from 'react'
import { Users, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react'

type ExceptionType = 'absent' | 'late' | 'left_early' | 'unrostered_arrival' | 'excused'

interface AttendanceException {
  id: string
  playerName: string
  exceptionType: ExceptionType
  note: string
}

interface Props {
  onDraftSaved?: (exceptions: AttendanceException[]) => void
}

const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  absent: 'Absent',
  late: 'Late arrival',
  left_early: 'Left early',
  unrostered_arrival: 'Showed up (not on roster)',
  excused: 'Excused absence',
}

const EXCEPTION_COLOUR: Record<ExceptionType, string> = {
  absent: 'text-status-red border-status-red/30',
  late: 'text-status-orange border-status-orange/30',
  left_early: 'text-status-orange border-status-orange/30',
  unrostered_arrival: 'text-status-blue border-status-blue/30',
  excused: 'text-text-muted border-border',
}

// Quick-add presets for common coach phrases
const QUICK_PRESETS: Array<{ label: string; exceptionType: ExceptionType; note: string }> = [
  { label: 'Everyone present', exceptionType: 'absent', note: '' },
  { label: 'Someone was absent', exceptionType: 'absent', note: 'Absent today' },
  { label: 'Late arrival', exceptionType: 'late', note: 'Arrived late' },
  { label: 'Left early', exceptionType: 'left_early', note: 'Left before session ended' },
  { label: 'Unexpected player showed up', exceptionType: 'unrostered_arrival', note: '' },
]

export function CoachAttendanceExceptionDraftCard({ onDraftSaved }: Props) {
  const [exceptions, setExceptions] = useState<AttendanceException[]>([])
  const [allPresent, setAllPresent] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [exceptionType, setExceptionType] = useState<ExceptionType>('absent')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  function addException() {
    if (!playerName.trim()) return
    const ex: AttendanceException = {
      id: `exc_${Date.now()}`,
      playerName: playerName.trim(),
      exceptionType,
      note: note.trim(),
    }
    setExceptions(prev => [...prev, ex])
    setPlayerName('')
    setNote('')
  }

  function removeException(id: string) {
    setExceptions(prev => prev.filter(e => e.id !== id))
  }

  function handleSave() {
    onDraftSaved?.(exceptions)
    setSaved(true)
  }

  function handleAllPresent() {
    setAllPresent(true)
    setExceptions([])
    setSaved(true)
    onDraftSaved?.([])
  }

  if (saved && allPresent) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-status-green/20 bg-status-green/5">
        <CheckCircle className="w-4 h-4 text-status-green shrink-0" />
        <p className="text-[11px] text-status-green font-medium">Everyone present — no exceptions noted.</p>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] font-medium text-lime">
            {exceptions.length} attendance exception{exceptions.length !== 1 ? 's' : ''} drafted
          </p>
        </div>
        <div className="space-y-1">
          {exceptions.map(ex => (
            <div key={ex.id} className="flex items-center gap-2 text-[10px]">
              <span className={`font-medium ${EXCEPTION_COLOUR[ex.exceptionType].split(' ')[0]}`}>
                {EXCEPTION_LABELS[ex.exceptionType]}
              </span>
              <span className="text-text-secondary">{ex.playerName}</span>
              {ex.note && <span className="text-text-muted">({ex.note})</span>}
            </div>
          ))}
        </div>
        <p className="text-[9px] text-text-muted">
          {exceptions.some(e => e.exceptionType === 'unrostered_arrival')
            ? 'Unrostered players flagged for director review — no roster change until approved.'
            : 'Exceptions saved as local draft. Submit at session wrap-up for director review.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <p className="text-[11px] font-medium text-text-secondary">Attendance exceptions</p>
      </div>

      {/* Quick all-present */}
      <button
        onClick={handleAllPresent}
        className="w-full px-3 py-2.5 rounded-xl border border-status-green/30 bg-status-green/5 text-status-green text-[12px] font-medium hover:bg-status-green/10 transition-colors"
      >
        ✓ Everyone present — no exceptions
      </button>

      {/* Exception list */}
      {exceptions.length > 0 && (
        <div className="space-y-1.5">
          {exceptions.map(ex => (
            <div
              key={ex.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-[11px]"
            >
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${EXCEPTION_COLOUR[ex.exceptionType]}`}>
                {EXCEPTION_LABELS[ex.exceptionType]}
              </span>
              <span className="flex-1 text-text-secondary truncate">{ex.playerName}</span>
              {ex.note && <span className="text-text-muted/60 text-[10px] truncate max-w-[80px]">{ex.note}</span>}
              <button
                onClick={() => removeException(ex.id)}
                className="text-text-muted hover:text-status-red transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add exception form */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Player name…"
            onKeyDown={e => e.key === 'Enter' && addException()}
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
          />
          <select
            value={exceptionType}
            onChange={e => setExceptionType(e.target.value as ExceptionType)}
            className="text-[11px] bg-surface border border-border rounded-xl px-2 py-2 text-text-secondary focus:outline-none focus:border-lime/40"
          >
            {(Object.entries(EXCEPTION_LABELS) as [ExceptionType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note…"
            className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
          />
          <button
            onClick={addException}
            disabled={!playerName.trim()}
            className="px-3 py-2 rounded-xl border border-lime/30 bg-lime/10 text-lime hover:bg-lime/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unrostered warning */}
      {exceptions.some(e => e.exceptionType === 'unrostered_arrival') && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-status-blue/20 bg-status-blue/5">
          <AlertTriangle className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            Unrostered arrivals go to director review. No roster change is made until approved.
          </p>
        </div>
      )}

      {/* Quick presets */}
      <div className="space-y-1">
        <p className="text-[9px] uppercase tracking-widest text-text-muted">Quick add</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PRESETS.slice(1).map(p => (
            <button
              key={p.label}
              onClick={() => {
                setExceptionType(p.exceptionType)
                setNote(p.note)
              }}
              className="text-[10px] px-2 py-1 rounded-lg border border-border bg-surface text-text-muted hover:border-lime/30 hover:text-text-secondary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {exceptions.length > 0 && (
        <button
          onClick={handleSave}
          className="btn-lime w-full"
        >
          Save {exceptions.length} Exception{exceptions.length !== 1 ? 's' : ''} as Draft
        </button>
      )}

      <p className="text-[9px] text-text-muted/60 text-center">
        All exceptions are draft only. Nothing official changes until director review.
      </p>
    </div>
  )
}
