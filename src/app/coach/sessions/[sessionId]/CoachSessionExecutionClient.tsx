'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, AlertCircle, Info, Play, Square } from 'lucide-react'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import type { SaveExecutionInput, SaveExecutionResult, SaveAttendanceInput, SaveAttendanceResult } from './actions'
import { updateBlockStatusAction, type BlockActualStatus } from './updateBlockStatusAction'
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

  // Per-exercise status: done / skipped / modified / planned
  type ExerciseStatus = 'planned' | 'done' | 'skipped' | 'modified'
  const [exerciseStatusMap, setExerciseStatusMap] = useState<Record<string, ExerciseStatus>>(() => {
    const init: Record<string, ExerciseStatus> = {}
    for (const ex of exercises) init[ex.id] = ex.completed ? 'done' : 'planned'
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

  function setBlockStatus(blockId: string, s: BlockActualStatus) {
    // Optimistic update: React state + localStorage (immediate feedback, no server round-trip wait)
    setBlockStatusMap(prev => {
      const next = { ...prev, [blockId]: s }
      try {
        const wrapUpStatus: Record<string, 'completed' | 'skipped' | 'modified'> = {}
        for (const [id, status] of Object.entries(next)) {
          wrapUpStatus[id] = status === 'skipped' ? 'skipped' : status === 'modified' ? 'modified' : 'completed'
        }
        localStorage.setItem(`session_block_status_${sessionId}`, JSON.stringify(wrapUpStatus))
      } catch { /* ignore storage errors */ }
      return next
    })
    // Persist to DB — fires in background, failure is non-blocking (status is still saved at wrap-up)
    startTransition(async () => {
      await updateBlockStatusAction({ sessionId, blockId, status: s })
    })
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

  function setExerciseStatus(id: string, s: ExerciseStatus) {
    setExerciseStatusMap(prev => ({ ...prev, [id]: s }))
    setSaveResult(null)
  }

  function markAllPresent() {
    setAttendanceMap(prev => {
      const next = { ...prev }
      for (const p of roster) next[p.playerId] = 'present'
      return next
    })
    setAttendanceResult(null)
  }

  function markBlockAllDone(blockId: string) {
    const blockExercises = exercisesByBlock.get(blockId) ?? []
    setExerciseStatusMap(prev => {
      const next = { ...prev }
      for (const ex of blockExercises) next[ex.id] = 'done'
      return next
    })
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
      const exerciseUpdates = exercises.map(ex => {
        const exStatus = exerciseStatusMap[ex.id] ?? 'planned'
        const rawNotes = notesMap[ex.id]?.trim() || ''
        // Prepend status label only for skipped/modified to aid director diff view
        let notes: string | null = rawNotes || null
        if (exStatus === 'skipped' && rawNotes && !rawNotes.startsWith('[Skipped]')) {
          notes = `[Skipped] ${rawNotes}`
        } else if (exStatus === 'skipped' && !rawNotes) {
          notes = '[Skipped]'
        } else if (exStatus === 'modified' && rawNotes && !rawNotes.startsWith('[Modified]')) {
          notes = `[Modified] ${rawNotes}`
        }
        return {
          id: ex.id,
          completed: exStatus === 'done' || exStatus === 'modified',
          notes,
        }
      })
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
      const exerciseUpdates = exercises.map(ex => { const s = exerciseStatusMap[ex.id] ?? 'planned'; return { id: ex.id, completed: s === 'done' || s === 'modified', notes: notesMap[ex.id]?.trim() || null } }) as Array<{ id: string; completed: boolean; notes: string | null }>
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
  const completedCount = Object.values(exerciseStatusMap).filter(s => s === 'done' || s === 'modified').length
  const skippedCount = Object.values(exerciseStatusMap).filter(s => s === 'skipped').length

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
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={markAllPresent}
                  disabled={isAttendancePending}
                  className="text-[10px] font-medium px-2 py-1 rounded border border-status-green/30 text-status-green bg-status-green/5 hover:bg-status-green/10 transition-colors disabled:opacity-50"
                >
                  All present
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={isAttendancePending}
                  className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAttendancePending ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Attendance records who actually showed up for this planned session.
            Player-specific development updates will be added later through coach recap and confirmed notes.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {roster.length === 0 ? (
            <div className="py-4 text-center space-y-1">
              <p className="text-sm text-text-muted">No roster for this session.</p>
              <p className="text-xs text-text-muted">Players appear here once a director assigns a training group to this session.</p>
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
                        aria-label={`Mark ${s}`}
                        aria-pressed={attendanceMap[player.playerId] === s}
                        onClick={() => markAttendance(player.playerId, s)}
                        className={`w-10 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
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
              <p className="text-[10px] text-text-muted pt-2 border-t border-border/50">
                Player not on this list? Use the Unexpected Attendees section in the Session Wrap-Up — their attendance goes to director review.
              </p>
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
                {completedCount} / {totalExercises} exercises done
                {skippedCount > 0 && (
                  <span className="text-status-red ml-2 text-xs font-normal">
                    · {skippedCount} skipped
                  </span>
                )}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">Session edits only — master template is unchanged.</p>
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
                  <div className="flex items-center gap-2 shrink-0">
                    {blockExercises.length > 0 && (() => {
                      const doneInBlock = blockExercises.filter(ex => {
                        const s = exerciseStatusMap[ex.id] ?? 'planned'
                        return s === 'done' || s === 'modified'
                      }).length
                      return (
                        <span className={`text-[10px] font-mono font-semibold ${doneInBlock === blockExercises.length ? 'text-status-green' : 'text-lime'}`}>
                          {doneInBlock}/{blockExercises.length}
                        </span>
                      )
                    })()}
                    <p className="text-sm font-mono font-bold text-lime">{block.duration_min} min</p>
                  </div>
                </div>
                {block.notes && (
                  <p className="text-xs text-text-muted mt-1">{block.notes}</p>
                )}
                {/* Per-block status tracker + mark-all shortcut */}
                <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {(['planned', 'in_progress', 'completed', 'skipped', 'modified'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBlockStatus(block.id, s)}
                        className={`text-[10px] px-2 py-1.5 rounded-lg border font-medium transition-colors ${
                          blockStatusMap[block.id] === s
                            ? blockStatusActiveClass(s)
                            : 'bg-surface border-border text-text-muted hover:border-text-muted'
                        }`}
                      >
                        {blockStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                  {blockExercises.length > 0 && (
                    <button
                      type="button"
                      onClick={() => markBlockAllDone(block.id)}
                      className="text-[10px] font-medium text-text-muted hover:text-status-green transition-colors shrink-0"
                    >
                      Mark all done
                    </button>
                  )}
                </div>
              </CardHeader>

              {blockExercises.length > 0 ? (
                <CardContent className="pt-0 space-y-3">
                  {blockExercises.map((ex, exIdx) => {
                    const exStatus = exerciseStatusMap[ex.id] ?? 'planned'
                    return (
                      <div key={ex.id} className="space-y-2 border-t border-border first:border-0 pt-2 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${
                              exStatus === 'done' ? 'text-text-muted line-through' :
                              exStatus === 'skipped' ? 'text-status-red/70 line-through' :
                              exStatus === 'modified' ? 'text-status-orange' :
                              'text-text-primary'
                            }`}>
                              <span className="text-[10px] font-mono text-text-muted mr-1.5">{exIdx + 1}.</span>
                              {ex.exerciseName}
                            </p>
                            {ex.exerciseCategory && (
                              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                                {ex.exerciseCategory}
                                {ex.duration_min ? ` · ${ex.duration_min} min` : ''}
                              </p>
                            )}
                          </div>
                          {/* Exercise status buttons — session-level only, template unchanged */}
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setExerciseStatus(ex.id, exStatus === 'done' ? 'planned' : 'done')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                exStatus === 'done'
                                  ? 'bg-status-green/10 border-status-green/40 text-status-green'
                                  : 'bg-surface border-border text-text-muted hover:border-status-green/40 hover:text-status-green'
                              }`}
                            >
                              Done
                            </button>
                            <button
                              type="button"
                              onClick={() => setExerciseStatus(ex.id, exStatus === 'modified' ? 'planned' : 'modified')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                exStatus === 'modified'
                                  ? 'bg-status-orange/10 border-status-orange/40 text-status-orange'
                                  : 'bg-surface border-border text-text-muted hover:border-status-orange/40 hover:text-status-orange'
                              }`}
                            >
                              Mod
                            </button>
                            <button
                              type="button"
                              onClick={() => setExerciseStatus(ex.id, exStatus === 'skipped' ? 'planned' : 'skipped')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                exStatus === 'skipped'
                                  ? 'bg-status-red/10 border-status-red/40 text-status-red'
                                  : 'bg-surface border-border text-text-muted hover:border-status-red/40 hover:text-status-red'
                              }`}
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                        {/* Session note for this exercise */}
                        <textarea
                          value={notesMap[ex.id] ?? ''}
                          onChange={e => {
                            setNotesMap(prev => ({ ...prev, [ex.id]: e.target.value }))
                            setSaveResult(null)
                          }}
                          placeholder={
                            exStatus === 'skipped' ? 'Skip reason…' :
                            exStatus === 'modified' ? 'What changed…' :
                            'Session note…'
                          }
                          rows={1}
                          className="w-full text-xs bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50 transition-colors"
                        />
                      </div>
                    )
                  })}
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
