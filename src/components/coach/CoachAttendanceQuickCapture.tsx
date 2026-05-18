'use client'

import { useState } from 'react'
import { Check, AlertTriangle, Clock, LogOut, UserPlus, Users } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'left_early'

export interface QuickCapturePlayer {
  playerId: string
  fullName: string
}

export interface AttendanceCapture {
  playerId: string
  fullName: string
  status: AttendanceStatus
}

export interface UnrosteredCapture {
  name: string
  note: string
}

// ── Status config ─────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; activeColor: string; icon: React.ReactNode }> = {
  present:    { label: 'Here', color: 'border-border text-text-muted', activeColor: 'border-status-green/50 bg-status-green/10 text-status-green', icon: <Check className="w-3.5 h-3.5" /> },
  absent:     { label: 'Absent', color: 'border-border text-text-muted', activeColor: 'border-status-red/50 bg-status-red/10 text-status-red', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  late:       { label: 'Late', color: 'border-border text-text-muted', activeColor: 'border-status-orange/50 bg-status-orange/10 text-status-orange', icon: <Clock className="w-3.5 h-3.5" /> },
  left_early: { label: 'Left Early', color: 'border-border text-text-muted', activeColor: 'border-status-blue/50 bg-status-blue/10 text-status-blue', icon: <LogOut className="w-3.5 h-3.5" /> },
}

// ── Player row ────────────────────────────────────────────────

function PlayerRow({
  player,
  status,
  onChange,
}: {
  player: QuickCapturePlayer
  status: AttendanceStatus
  onChange: (status: AttendanceStatus) => void
}) {
  const initials = player.fullName
    .trim()
    .split(' ')
    .map(p => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-text-secondary">{initials}</span>
        </div>
        <p className="text-sm font-medium text-text-primary flex-1 truncate">{player.fullName}</p>
        {status !== 'present' && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_CONFIG[status].activeColor}`}>
            {STATUS_CONFIG[status].label}
          </span>
        )}
      </div>
      <div className="flex gap-1.5 pl-9">
        {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
              status === key ? cfg.activeColor : cfg.color + ' hover:bg-surface-raised'
            }`}
          >
            {cfg.icon}
            {cfg.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  players: QuickCapturePlayer[]
  onCapture?: (attendance: AttendanceCapture[], unrostered: UnrosteredCapture[]) => void
}

export function CoachAttendanceQuickCapture({ players, onCapture }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(() => {
    const init: Record<string, AttendanceStatus> = {}
    for (const p of players) init[p.playerId] = 'present'
    return init
  })

  const [allPresent, setAllPresent] = useState(false)
  const [showUnrostered, setShowUnrostered] = useState(false)
  const [unrosteredName, setUnrosteredName] = useState('')
  const [unrosteredNote, setUnrosteredNote] = useState('')
  const [unrosteredList, setUnrosteredList] = useState<UnrosteredCapture[]>([])
  const [captureComplete, setCaptureComplete] = useState(false)

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {}
    for (const p of players) next[p.playerId] = status
    setStatusMap(next)
    if (status === 'present') setAllPresent(true)
  }

  function setStatus(playerId: string, status: AttendanceStatus) {
    setStatusMap(prev => ({ ...prev, [playerId]: status }))
    setAllPresent(false)
  }

  function addUnrostered() {
    if (!unrosteredName.trim()) return
    setUnrosteredList(prev => [...prev, { name: unrosteredName.trim(), note: unrosteredNote.trim() || 'Unknown' }])
    setUnrosteredName('')
    setUnrosteredNote('')
  }

  function removeUnrostered(i: number) {
    setUnrosteredList(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleCapture() {
    const attendance: AttendanceCapture[] = players.map(p => ({
      playerId: p.playerId,
      fullName: p.fullName,
      status: statusMap[p.playerId] ?? 'present',
    }))
    onCapture?.(attendance, unrosteredList)
    setCaptureComplete(true)
  }

  if (captureComplete) {
    return (
      <div className="rounded-2xl border border-status-green/30 bg-status-green/5 p-5 text-center space-y-2">
        <Check className="w-5 h-5 text-status-green mx-auto" />
        <p className="text-sm font-semibold text-text-primary">Attendance captured</p>
        <p className="text-xs text-text-muted">
          {unrosteredList.length > 0
            ? `${unrosteredList.length} unrostered attendee${unrosteredList.length !== 1 ? 's' : ''} flagged for director review.`
            : 'Nothing flagged for director review.'}
        </p>
        <button
          onClick={() => setCaptureComplete(false)}
          className="text-xs text-lime hover:opacity-80 font-medium"
        >
          Edit attendance
        </button>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <Users className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No roster for this session.</p>
        <p className="text-xs text-text-muted mt-1">Roster is set by your director through the group assignment.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">

      {/* Quick actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={() => markAll('present')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-green/30 bg-status-green/5 text-status-green text-xs font-medium hover:bg-status-green/10 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          Everyone Here
        </button>
        <p className="text-[10px] text-text-muted ml-1">or mark individually below</p>
      </div>

      {/* Player list */}
      <div className="px-4">
        {players.map(p => (
          <PlayerRow
            key={p.playerId}
            player={p}
            status={statusMap[p.playerId] ?? 'present'}
            onChange={(s) => setStatus(p.playerId, s)}
          />
        ))}
      </div>

      {/* Unrostered attendee */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={() => setShowUnrostered(v => !v)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showUnrostered ? 'Hide' : 'Someone not on the roster showed up'}
        </button>

        {showUnrostered && (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-status-orange/30 bg-status-orange/5 px-3 py-2">
              <p className="text-[10px] text-status-orange font-medium mb-0.5">Director review required</p>
              <p className="text-[10px] text-text-muted leading-snug">
                Adding an unrostered player creates a review draft for your director. It does not add them to the roster, trigger billing, or message their parent.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={unrosteredName}
                onChange={e => setUnrosteredName(e.target.value)}
                placeholder="Player name"
                className="flex-1 rounded-xl bg-surface-raised border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
              />
              <input
                value={unrosteredNote}
                onChange={e => setUnrosteredNote(e.target.value)}
                placeholder="Reason (trial, makeup...)"
                className="flex-1 rounded-xl bg-surface-raised border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
              />
              <button
                onClick={addUnrostered}
                disabled={!unrosteredName.trim()}
                className="px-3 py-2 rounded-xl bg-lime text-black text-xs font-bold disabled:opacity-40 hover:bg-lime/90 transition-all"
              >
                Add
              </button>
            </div>
            {unrosteredList.length > 0 && (
              <ul className="space-y-1">
                {unrosteredList.map((u, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-border">
                    <div>
                      <p className="text-xs font-medium text-text-primary">{u.name}</p>
                      <p className="text-[10px] text-text-muted">{u.note}</p>
                    </div>
                    <button onClick={() => removeUnrostered(i)} className="text-[10px] text-text-muted hover:text-status-red transition-colors">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={handleCapture}
          className="w-full py-3 rounded-xl bg-lime text-black text-sm font-bold hover:bg-lime/90 transition-all"
        >
          Save Attendance
        </button>
      </div>

    </div>
  )
}
