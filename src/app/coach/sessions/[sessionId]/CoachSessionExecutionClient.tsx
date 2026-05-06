'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, AlertCircle, Info, Play, Square } from 'lucide-react'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import type { SaveExecutionInput, SaveExecutionResult, SaveAttendanceInput, SaveAttendanceResult } from './actions'
import type { SessionBlock, SessionExercise, RosterPlayer } from './page'

const STAGE_TEXT: Record<string, string> = {
  red_foundation:     'text-red-400',
  orange_development: 'text-amber-400',
  green_performance:  'text-green-400',
  yellow_competitive: 'text-yellow-300',
  high_performance:   'text-violet-400',
}

interface Props {
  sessionId: string
  initialStatus: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  initialSessionNotes: string
  blocks: SessionBlock[]
  exercises: SessionExercise[]
  roster: RosterPlayer[]
  saveAction: (input: SaveExecutionInput) => Promise<SaveExecutionResult>
  saveAttendanceAction: (input: SaveAttendanceInput) => Promise<SaveAttendanceResult>
}

export function CoachSessionExecutionClient({
  sessionId,
  initialStatus,
  initialSessionNotes,
  blocks,
  exercises,
  roster,
  saveAction,
  saveAttendanceAction,
}: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [sessionNotes, setSessionNotes] = useState(initialSessionNotes)

  // Keyed by exercise id
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const ex of exercises) init[ex.id] = ex.completed
    return init
  })
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const ex of exercises) init[ex.id] = ex.notes ?? ''
    return init
  })

  // Block progress state — keyed by block id; stored locally, feeds into Wrap-Up
  const [blockStatusMap, setBlockStatusMap] = useState<Record<string, 'planned' | 'in_progress' | 'completed' | 'skipped' | 'modified'>>(() => {
    const init: Record<string, 'planned' | 'in_progress' | 'completed' | 'skipped' | 'modified'> = {}
    for (const b of blocks) init[b.id] = 'planned'
    return init
  })

  function setBlockStatus(blockId: string, s: 'planned' | 'in_progress' | 'completed' | 'skipped' | 'modified') {
    setBlockStatusMap(prev => ({ ...prev, [blockId]: s }))
  }

  const [saveResult, setSaveResult] = useState<SaveExecutionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // Attendance state — keyed by player_id
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>(() => {
    const init: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {}
    for (const p of roster) {
      if (p.currentStatus) init[p.playerId] = p.currentStatus
    }
    return init
  })
  const [attendanceResult, setAttendanceResult] = useState<SaveAttendanceResult | null>(null)
  const [isAttendancePending, startAttendanceTransition] = useTransition()

  // Exercises grouped by block
  const exercisesByBlock = new Map<string, SessionExercise[]>()
  for (const ex of exercises) {
    const list = exercisesByBlock.get(ex.block_id) ?? []
    list.push(ex)
    exercisesByBlock.set(ex.block_id, list)
  }

  function toggleExercise(id: string) {
    setCompletedMap(prev => ({ ...prev, [id]: !prev[id] }))
    setSaveResult(null)
  }

  function markAttendance(playerId: string, status: 'present' | 'absent' | 'late' | 'excused') {
    setAttendanceMap(prev => ({ ...prev, [playerId]: status }))
    setAttendanceResult(null)
  }

  function handleSaveAttendance() {
    setAttendanceResult(null)
    startAttendanceTransition(async () => {
      const updates = roster
        .filter(p => attendanceMap[p.playerId] != null)
        .map(p => ({ playerId: p.playerId, status: attendanceMap[p.playerId] }))
      if (updates.length === 0) {
        setAttendanceResult({ ok: false, error: 'Mark at least one player before saving.' })
        return
      }
      const result = await saveAttendanceAction({ sessionId, attendanceUpdates: updates })
      setAttendanceResult(result)
    })
  }

  function handleSave() {
    setSaveResult(null)
    startTransition(async () => {
      const exerciseUpdates = exercises.map(ex => ({
        id: ex.id,
        completed: completedMap[ex.id] ?? false,
        notes: notesMap[ex.id]?.trim() || null,
      }))
      const result = await saveAction({
        sessionId,
        status,
        sessionNotes: sessionNotes.trim() || null,
        exerciseUpdates,
      })
      setSaveResult(result)
    })
  }

  function handleQuickStatusChange(newStatus: 'in_progress' | 'completed') {
    setSaveResult(null)
    startTransition(async () => {
      const exerciseUpdates = exercises.map(ex => ({
        id: ex.id,
        completed: completedMap[ex.id] ?? false,
        notes: notesMap[ex.id]?.trim() || null,
      }))
      const result = await saveAction({
        sessionId,
        status: newStatus,
        sessionNotes: sessionNotes.trim() || null,
        exerciseUpdates,
      })
      if (result.ok) setStatus(newStatus)
      setSaveResult(result)
    })
  }

  const totalExercises = exercises.length
  const completedCount = Object.values(completedMap).filter(Boolean).length

  return (
    <div className="space-y-6">

      {/* ── Start / End Session CTA ───────────────────────── */}
      {(status === 'planned' || status === 'in_progress') && (
        <div>
          {status === 'planned' && (
            <button
              type="button"
              onClick={() => handleQuickStatusChange('in_progress')}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-lime/10 border border-lime/30 text-lime font-semibold text-sm hover:bg-lime/20 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {isPending ? 'Starting…' : 'Start Session'}
            </button>
          )}
          {status === 'in_progress' && (
            <button
              type="button"
              onClick={() => handleQuickStatusChange('completed')}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-status-green/10 border border-status-green/30 text-status-green font-semibold text-sm hover:bg-status-green/20 transition-colors disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              {isPending ? 'Ending…' : 'End Session'}
            </button>
          )}
        </div>
      )}

      {/* Attendance roster */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <SectionHeader title="ATTENDANCE" />
            {roster.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isAttendancePending}
                className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isAttendancePending ? 'Saving…' : 'Save Attendance'}
              </button>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Attendance records who actually showed up for this planned session.
            Player-specific development updates will be added later through coach recap and confirmed notes.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {roster.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-text-muted">No players are attached to this session yet.</p>
              <p className="text-xs text-text-muted mt-1">Player roster assignment will be added in a future sprint.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roster.map(player => (
                <div key={player.playerId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{player.fullName}</p>
                    {player.curriculumLevelName && (
                      <p className={`text-[10px] font-medium mt-0.5 ${STAGE_TEXT[player.curriculumStage ?? ''] ?? 'text-text-muted'}`}>
                        {player.curriculumLevelName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(['present', 'absent', 'late', 'excused'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => markAttendance(player.playerId, s)}
                        className={`w-8 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                          attendanceMap[player.playerId] === s
                            ? attendanceActiveClass(s)
                            : 'bg-surface-raised text-text-muted border-border hover:text-text-secondary'
                        }`}
                      >
                        {s[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {attendanceResult && (
            <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs ${
              attendanceResult.ok
                ? 'bg-status-green/10 border border-status-green/30 text-status-green'
                : 'bg-status-red/10 border border-status-red/30 text-status-red'
            }`}>
              {attendanceResult.ok ? (
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{attendanceResult.ok ? 'Attendance saved.' : (attendanceResult.error ?? 'Unknown error.')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status + progress */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Session Status</p>
            <div className="flex flex-wrap gap-2">
              {(['planned', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatus(s); setSaveResult(null) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    status === s
                      ? statusActiveClass(s)
                      : 'bg-surface-raised text-text-muted border-border hover:border-border hover:text-text-secondary'
                  }`}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {totalExercises > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Progress</p>
              <p className="text-sm font-mono font-bold text-lime">
                {completedCount} / {totalExercises} exercises completed
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Session Notes</p>
            <textarea
              value={sessionNotes}
              onChange={e => { setSessionNotes(e.target.value); setSaveResult(null) }}
              placeholder="Add session notes…"
              rows={3}
              className="w-full text-sm bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Block progress summary */}
      {blocks.length > 0 && (() => {
        const completed = blocks.filter(b => blockStatusMap[b.id] === 'completed').length
        const skipped = blocks.filter(b => blockStatusMap[b.id] === 'skipped').length
        const modified = blocks.filter(b => blockStatusMap[b.id] === 'modified').length
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-xs text-text-muted">
            <Info className="w-3.5 h-3.5 shrink-0 text-lime" />
            <span>
              Blocks: <span className="text-status-green font-medium">{completed} done</span>
              {skipped > 0 && <>, <span className="text-status-orange font-medium">{skipped} skipped</span></>}
              {modified > 0 && <>, <span className="text-status-blue font-medium">{modified} modified</span></>}
              {' · Mark status per block below'}
            </span>
          </div>
        )
      })()}

      {/* Blocks + exercises */}
      <div className="space-y-4">
        <SectionHeader title="EXERCISES" />
        {/* Migration gate: blocks loaded but no exercises — likely migration 056 not applied */}
        {blocks.length > 0 && exercises.length === 0 && (
          <div className="flex items-start gap-2 px-3 py-3 rounded-lg bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Session exercises are missing. This usually means migration 056 has not been applied to your Supabase instance.
              Verify with: <code className="font-mono text-[10px]">SELECT policyname FROM pg_policies WHERE tablename = &apos;session_block_exercises&apos;;</code>
            </span>
          </div>
        )}
        {blocks.map((block, idx) => {
          const blockExercises = exercisesByBlock.get(block.id) ?? []
          return (
            <Card key={block.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
                      Block {idx + 1} · {block.type}
                    </p>
                    <p className="font-semibold text-text-primary text-sm">{block.name}</p>
                  </div>
                  <p className="text-sm font-mono font-bold text-lime shrink-0">{block.duration_min} min</p>
                </div>
                {block.notes && (
                  <p className="text-xs text-text-muted mt-1">{block.notes}</p>
                )}
                {/* Per-block status tracker — local state, feeds into Wrap-Up */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(['planned', 'in_progress', 'completed', 'skipped', 'modified'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBlockStatus(block.id, s)}
                      className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-colors ${
                        blockStatusMap[block.id] === s
                          ? blockStatusActiveClass(s)
                          : 'bg-surface border-border text-text-muted hover:border-text-muted'
                      }`}
                    >
                      {blockStatusLabel(s)}
                    </button>
                  ))}
                </div>
              </CardHeader>

              {blockExercises.length > 0 ? (
                <CardContent className="pt-0 space-y-3">
                  {blockExercises.map(ex => (
                    <div key={ex.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleExercise(ex.id)}
                        className="w-full flex items-start gap-3 text-left group"
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                          completedMap[ex.id]
                            ? 'bg-status-green border-status-green'
                            : 'border-border bg-surface-raised group-hover:border-lime/50'
                        }`}>
                          {completedMap[ex.id] && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium transition-colors ${
                            completedMap[ex.id] ? 'text-text-muted line-through' : 'text-text-primary'
                          }`}>
                            {ex.exerciseName}
                          </p>
                          {ex.exerciseCategory && (
                            <p className="text-[10px] uppercase tracking-wider text-text-muted">
                              {ex.exerciseCategory}
                            </p>
                          )}
                        </div>
                        {ex.duration_min && (
                          <p className="text-xs font-mono text-text-muted shrink-0">{ex.duration_min} min</p>
                        )}
                      </button>
                      <div className="pl-8">
                        <textarea
                          value={notesMap[ex.id] ?? ''}
                          onChange={e => {
                            setNotesMap(prev => ({ ...prev, [ex.id]: e.target.value }))
                            setSaveResult(null)
                          }}
                          placeholder="Add note…"
                          rows={1}
                          className="w-full text-xs bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              ) : (
                <CardContent className="pt-0">
                  <p className="text-xs text-text-muted">No exercises in this block.</p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Save controls */}
      <div className="space-y-3">
        {saveResult && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
            saveResult.ok
              ? 'bg-status-green/10 border border-status-green/30 text-status-green'
              : 'bg-status-red/10 border border-status-red/30 text-status-red'
          }`}>
            {saveResult.ok ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{saveResult.ok ? 'Execution saved successfully.' : (saveResult.error ?? 'Unknown error.')}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save Execution'}
        </button>
      </div>
    </div>
  )
}

function statusLabel(s: string) {
  return { planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }[s] ?? s
}

function statusActiveClass(s: string) {
  return {
    planned: 'bg-surface-raised text-text-primary border-lime/50',
    in_progress: 'bg-lime/10 text-lime border-lime/50',
    completed: 'bg-status-green/10 text-status-green border-status-green/50',
    cancelled: 'bg-status-red/10 text-status-red border-status-red/50',
  }[s] ?? 'bg-surface-raised text-text-primary border-lime/50'
}

function attendanceActiveClass(s: string) {
  return {
    present: 'bg-status-green/10 text-status-green border-status-green/50',
    absent: 'bg-status-red/10 text-status-red border-status-red/50',
    late: 'bg-status-orange/10 text-status-orange border-status-orange/50',
    excused: 'bg-status-blue/10 text-status-blue border-status-blue/50',
  }[s] ?? 'bg-surface-raised text-text-primary border-lime/50'
}

function blockStatusLabel(s: string): string {
  return { planned: 'Planned', in_progress: 'Active', completed: 'Done', skipped: 'Skipped', modified: 'Modified' }[s] ?? s
}

function blockStatusActiveClass(s: string): string {
  return {
    planned: 'bg-surface-raised text-text-secondary border-lime/30',
    in_progress: 'bg-lime/10 text-lime border-lime/50',
    completed: 'bg-status-green/10 text-status-green border-status-green/40',
    skipped: 'bg-status-orange/10 text-status-orange border-status-orange/40',
    modified: 'bg-status-blue/10 text-status-blue border-status-blue/40',
  }[s] ?? 'bg-surface-raised text-text-primary border-lime/50'
}
