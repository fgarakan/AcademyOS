'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Loader2, Copy } from 'lucide-react'
import { saveSessionRecapAction } from './actions'
import { saveWrapUpDraftAction, type BlockCompletionDraft } from './saveWrapUpDraftAction'
import { saveWrapUpObservationsAction, type PlayerObservationInput } from './saveWrapUpObservationsAction'
import { saveAttendanceAction, type AttendanceUpdate } from './actions'
import type { SessionBlock, RosterPlayer } from './page'

// ─────────────────────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────────────────────

interface WrapUpStep {
  key: string
  question: string
  hint: string
  placeholder: string
}

const STEPS: WrapUpStep[] = [
  {
    key: 'attendance',
    question: 'Was everyone here, or was anyone missing or added today?',
    hint: 'Mention absences, late arrivals, or any players who weren\'t on the roster.',
    placeholder: 'Everyone was here / Max was absent / A new player showed up',
  },
  {
    key: 'blocks',
    question: 'Did you complete all the planned blocks?',
    hint: 'If you skipped or shortened anything, mention it here.',
    placeholder: 'Yes, all blocks / We skipped the conditioning block',
  },
  {
    key: 'changes',
    question: 'What changed or got skipped — and why?',
    hint: 'Any deviations from the plan, adjustments made, or timing changes.',
    placeholder: 'Shortened warm-up due to late start. Skipped third drill — group was fatigued.',
  },
  {
    key: 'standouts',
    question: 'Who stood out today — in a good way or needs follow-up?',
    hint: 'Positive or negative. Skill breakthroughs, focus issues, anything noteworthy.',
    placeholder: 'Lucas was exceptional on serve. Emma struggled with movement consistency.',
  },
  {
    key: 'attention',
    question: 'Who needs specific attention next session?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Check in with Max after his absence.',
  },
  {
    key: 'next',
    question: 'What should the focus be for the next session?',
    hint: 'What would make the next session most valuable for this group?',
    placeholder: 'Serve placement and consistency under pressure. Build on today\'s forehand work.',
  },
]

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Props {
  sessionId: string
  sessionName: string
  blocks: SessionBlock[]
  roster: RosterPlayer[]
  onClose: () => void
}

// Player note for wrap-up: keyed by playerId
interface PlayerNote {
  playerId: string
  playerName: string
  note: string
  type: 'positive' | 'needs_attention'
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function CoachWrapUpDrawer({ sessionId, sessionName, blocks, roster, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ''))
  // block completion: 'completed' | 'skipped' | 'modified' per block
  const [blockStatus, setBlockStatus] = useState<Record<string, 'completed' | 'skipped' | 'modified'>>(() => {
    const init: Record<string, 'completed' | 'skipped' | 'modified'> = {}
    for (const b of blocks) init[b.id] = 'completed'
    return init
  })
  // player notes: indexed by playerId
  const [playerNotes, setPlayerNotes] = useState<Record<string, PlayerNote>>({})
  // attendance status per player: defaults to 'present' for each roster player
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>(() => {
    const init: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {}
    for (const p of roster) init[p.playerId] = p.currentStatus ?? 'present'
    return init
  })
  const [attendanceSaved, setAttendanceSaved] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [isAttendancePending, startAttendanceTransition] = useTransition()
  const [phase, setPhase] = useState<'questions' | 'summary' | 'saved'>('questions')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [draftRestored, setDraftRestored] = useState(false)

  const draftKey = `wrapup_draft_${sessionId}`

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw) as {
        stepIndex?: number
        answers?: string[]
        blockStatus?: Record<string, 'completed' | 'skipped' | 'modified'>
        playerNotes?: Record<string, PlayerNote>
        attendanceMap?: Record<string, 'present' | 'absent' | 'late' | 'excused'>
        phase?: 'questions' | 'summary'
      }
      if (typeof draft.stepIndex === 'number') setStepIndex(draft.stepIndex)
      if (Array.isArray(draft.answers) && draft.answers.length === STEPS.length) setAnswers(draft.answers)
      if (draft.blockStatus) setBlockStatus(draft.blockStatus)
      if (draft.playerNotes) setPlayerNotes(draft.playerNotes)
      if (draft.attendanceMap) setAttendanceMap(draft.attendanceMap)
      if (draft.phase === 'summary') setPhase('summary')
      setDraftRestored(true)
    } catch { /* ignore corrupt drafts */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // Auto-save draft to localStorage whenever relevant state changes
  useEffect(() => {
    if (phase === 'saved') return
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        stepIndex,
        answers,
        blockStatus,
        playerNotes,
        attendanceMap,
        phase,
      }))
    } catch { /* ignore quota errors */ }
  }, [draftKey, stepIndex, answers, blockStatus, playerNotes, attendanceMap, phase])

  const isLastQuestion = stepIndex === STEPS.length - 1
  const currentStep = STEPS[stepIndex]

  function setAnswer(idx: number, value: string) {
    setAnswers(prev => prev.map((a, i) => i === idx ? value : a))
  }

  function goNext() {
    if (isLastQuestion) {
      setPhase('summary')
    } else {
      setStepIndex(i => i + 1)
    }
  }

  function goBack() {
    if (phase === 'summary') {
      setPhase('questions')
      setStepIndex(STEPS.length - 1)
    } else if (stepIndex > 0) {
      setStepIndex(i => i - 1)
    }
  }

  function handleSaveAttendance() {
    setAttendanceError(null)
    const updates: AttendanceUpdate[] = roster.map(p => ({
      playerId: p.playerId,
      status: attendanceMap[p.playerId] ?? 'present',
    }))
    startAttendanceTransition(async () => {
      const result = await saveAttendanceAction({ sessionId, attendanceUpdates: updates })
      if (result.ok) {
        setAttendanceSaved(true)
      } else {
        setAttendanceError(result.error ?? 'Could not save attendance.')
      }
    })
  }

  function buildSummaryText(): string {
    const lines = STEPS.map((s, i) => {
      const answer = answers[i]?.trim() || '(skipped)'
      return `${s.question}\n${answer}`
    })
    return `[Coach Wrap-Up — ${sessionName}]\n\n${lines.join('\n\n')}`
  }

  function handleCopy() {
    const text = buildSummaryText()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSave() {
    setSaveError(null)
    const recapText = buildSummaryText()
    startTransition(async () => {
      // 1. Save raw text recap to voice_notes
      const recapResult = await saveSessionRecapAction({ sessionId, recapText })
      if (!recapResult.ok) {
        setSaveError(recapResult.error ?? 'Save failed. Try copying the summary instead.')
        return
      }

      // 2. Save structured session actual draft to proposed_actions (best-effort)
      const blockCompletion: BlockCompletionDraft[] = blocks.map(b => ({
        block_id: b.id,
        block_name: b.name,
        status: blockStatus[b.id] ?? 'completed',
        note: '',
      }))
      await saveWrapUpDraftAction(sessionId, sessionName, blockCompletion, {
        attendance: answers[0] ?? '',
        changes: answers[2] ?? '',
        standouts: answers[3] ?? '',
        attention: answers[4] ?? '',
        nextFocus: answers[5] ?? '',
        groupNote: answers[1] ?? '',
      })
      // 3. Save player observations (best-effort, is_private = true)
      const playerObservations: PlayerObservationInput[] = Object.values(playerNotes)
        .filter(n => n.note.trim())
        .map(n => ({
          playerId: n.playerId,
          playerName: n.playerName,
          note: n.note.trim(),
          observationType: n.type === 'positive' ? 'positive' : 'needs_attention',
        }))
      if (playerObservations.length > 0) {
        await saveWrapUpObservationsAction(sessionId, playerObservations)
      }

      try { localStorage.removeItem(draftKey) } catch { /* ignore */ }
      setPhase('saved')
    })
  }

  // ── Saved state ─────────────────────────────────────────────
  if (phase === 'saved') {
    return (
      <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
          <div className="w-14 h-14 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-status-green" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-base font-semibold text-text-primary">Wrap-up saved</p>
            <p className="text-sm text-text-muted">
              Your recap has been saved for director review. Nothing official has been changed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost px-5 py-2 text-sm mt-1"
          >
            Done
          </button>
        </div>
      </WrapUpShell>
    )
  }

  // ── Summary / review state ───────────────────────────────────
  if (phase === 'summary') {
    return (
      <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs text-text-muted">Review your wrap-up before saving. Nothing is official yet.</p>
          </div>
          <div className="px-5 py-4 space-y-5">
            {/* Attendance section — explicit per-player confirmation */}
            {roster.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Attendance</p>
                  {attendanceSaved && (
                    <span className="text-[10px] text-status-green font-semibold">Saved ✓</span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted leading-snug">
                  Your answer: &ldquo;{answers[0]?.trim() || 'Not answered'}&rdquo;
                  — confirm each player below before saving.
                </p>
                <div className="space-y-1.5">
                  {roster.map(p => (
                    <div key={p.playerId} className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary flex-1 truncate">{p.fullName}</span>
                      <select
                        value={attendanceMap[p.playerId] ?? 'present'}
                        onChange={e => setAttendanceMap(prev => ({
                          ...prev,
                          [p.playerId]: e.target.value as 'present' | 'absent' | 'late' | 'excused',
                        }))}
                        disabled={attendanceSaved || isAttendancePending}
                        className="text-[10px] bg-surface border border-border rounded px-2 py-0.5 text-text-secondary focus:outline-none focus:border-lime/40 disabled:opacity-50"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                    </div>
                  ))}
                </div>
                {attendanceError && (
                  <p className="text-[10px] text-status-red">{attendanceError}</p>
                )}
                {!attendanceSaved && (
                  <button
                    onClick={handleSaveAttendance}
                    disabled={isAttendancePending}
                    className="flex items-center gap-1.5 text-xs btn-lime px-3 py-1.5 disabled:opacity-50"
                  >
                    {isAttendancePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {isAttendancePending ? 'Saving…' : 'Save Attendance'}
                  </button>
                )}
                <p className="text-[9px] text-text-muted">
                  Unrostered players must go to director review — use the Attendance Exceptions panel in the session detail view.
                </p>
              </div>
            )}

            {STEPS.map((s, i) => (
              <div key={s.key}>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{s.question}</p>
                <p className={`text-sm ${answers[i]?.trim() ? 'text-text-primary' : 'text-text-muted italic'}`}>
                  {answers[i]?.trim() || 'Skipped'}
                </p>
                {/* Block completion editor after the "blocks" question */}
                {s.key === 'blocks' && blocks.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {blocks.map(b => (
                      <div key={b.id} className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary flex-1 truncate">{b.name}</span>
                        <select
                          value={blockStatus[b.id] ?? 'completed'}
                          onChange={e => setBlockStatus(prev => ({
                            ...prev,
                            [b.id]: e.target.value as 'completed' | 'skipped' | 'modified',
                          }))}
                          className="text-[10px] bg-surface-raised border border-border rounded px-2 py-0.5 text-text-secondary focus:outline-none focus:border-lime/40"
                        >
                          <option value="completed">Completed</option>
                          <option value="modified">Modified</option>
                          <option value="skipped">Skipped</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                {/* Player note fields for standouts / attention */}
                {(s.key === 'standouts' || s.key === 'attention') && roster.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-[9px] uppercase tracking-widest text-text-muted">
                      {s.key === 'standouts' ? 'Add player notes (optional)' : 'Flag for next session (optional)'}
                    </p>
                    {roster.map(p => {
                      const noteType: 'positive' | 'needs_attention' = s.key === 'standouts' ? 'positive' : 'needs_attention'
                      const key = `${p.playerId}:${noteType}`
                      const existing = playerNotes[key]
                      return (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-[10px] text-text-secondary mt-1.5 w-20 shrink-0 truncate">
                            {p.fullName.split(' ')[0]}
                          </span>
                          <input
                            type="text"
                            value={existing?.note ?? ''}
                            onChange={e => {
                              const note = e.target.value
                              setPlayerNotes(prev => {
                                if (!note) {
                                  const next = { ...prev }
                                  delete next[key]
                                  return next
                                }
                                return {
                                  ...prev,
                                  [key]: {
                                    playerId: p.playerId,
                                    playerName: p.fullName,
                                    note,
                                    type: noteType,
                                  },
                                }
                              })
                            }}
                            placeholder={s.key === 'standouts' ? 'What stood out?' : 'What needs attention?'}
                            className="flex-1 text-[11px] bg-surface-raised border border-border rounded px-2 py-1 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40"
                          />
                        </div>
                      )
                    })}
                    <p className="text-[9px] text-text-muted">Saved as internal coach notes — not visible to players or parents.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border space-y-3">
          {saveError && (
            <p className="text-xs text-status-red">{saveError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={isPending}
              className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors px-3 py-2 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-lime flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isPending ? 'Saving…' : 'Save Recap'}
            </button>
          </div>
        </div>
      </WrapUpShell>
    )
  }

  // ── Question step ────────────────────────────────────────────
  return (
    <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
      {/* Progress */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < stepIndex ? 'bg-lime' : i === stepIndex ? 'bg-lime/60' : 'bg-surface-raised'
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          Question {stepIndex + 1} of {STEPS.length}
        </p>
      </div>

      {/* Question content */}
      <div className="flex-1 px-5 space-y-5">
        <div>
          <p className="text-base font-semibold text-text-primary leading-snug mb-2">
            {currentStep.question}
          </p>
          <p className="text-xs text-text-muted">{currentStep.hint}</p>
        </div>

        <textarea
          value={answers[stepIndex]}
          onChange={e => setAnswer(stepIndex, e.target.value)}
          placeholder={currentStep.placeholder}
          rows={5}
          autoFocus
          className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 resize-none"
        />

        <p className="text-[10px] text-text-muted">
          Tap Next to continue — you can go back at any time. Nothing is saved until you tap Save Recap.
          {(draftRestored || answers.some(a => a.trim())) && (
            <span className="ml-1 text-lime/60">Draft saved locally.</span>
          )}
        </p>
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t border-border flex items-center gap-3">
        <button
          onClick={goBack}
          disabled={stepIndex === 0}
          className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1" />
        <button
          onClick={goNext}
          className="btn-lime flex items-center gap-1.5 text-sm px-4 py-2"
        >
          {isLastQuestion ? 'Review' : 'Next'}
          {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </WrapUpShell>
  )
}

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────

function WrapUpShell({
  sessionName,
  onClose,
  showClose,
  children,
}: {
  sessionName: string
  onClose: () => void
  showClose?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Coach Wrap-Up</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5 truncate max-w-[240px]">
            {sessionName}
          </p>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {children}
    </div>
  )
}
