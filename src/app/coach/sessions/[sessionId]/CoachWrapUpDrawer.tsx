'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Loader2, Copy, Plus, Volume2, VolumeX, AlertTriangle, User, Users, Square } from 'lucide-react'
import { VoiceInputButton } from '@/components/assistant/VoiceInputButton'
import { AudioRecorderButton } from '@/components/assistant/AudioRecorderButton'
import { saveSessionRecapAction } from './actions'
import { saveWrapUpDraftAction, type BlockCompletionDraft } from './saveWrapUpDraftAction'
import { saveWrapUpObservationsAction, type PlayerObservationInput } from './saveWrapUpObservationsAction'
import { saveAttendanceAction, type AttendanceUpdate } from './actions'
import { saveWrapUpAttendanceExceptionAction, type WrapUpUnrosteredEntry, type UnrosteredAttendeeNote } from './saveWrapUpAttendanceExceptionAction'
import type { SessionBlock, RosterPlayer } from './page'
import { speakDonna as speakDonnaPremium, stopDonna } from '@/lib/donna/voice/donnaPremiumVoiceRuntime'

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
    question: 'Did the session mostly follow the plan?',
    hint: 'All blocks completed, or were there skips and adjustments?',
    placeholder: 'Yes, followed the plan / Made small adjustments / Changed significantly — we skipped the conditioning block',
  },
  {
    key: 'changes',
    question: 'What changed or got skipped — and why?',
    hint: 'Any deviations from the plan, adjustments made, or timing changes.',
    placeholder: 'Shortened warm-up due to late start. Skipped third drill — group was fatigued.',
  },
  {
    key: 'standouts',
    question: 'Any players stand out positively today?',
    hint: 'Skill breakthroughs, great effort, focus — anything worth noting.',
    placeholder: 'Lucas was exceptional on serve. Emma showed real improvement on movement.',
  },
  {
    key: 'attention',
    question: 'Any players need extra attention next time?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Check in with Max after his absence.',
  },
  {
    key: 'next',
    question: 'What should the focus be for the next session?',
    hint: 'What would make the next session most valuable for this group?',
    placeholder: 'Serve placement and consistency under pressure. Build on today\'s forehand work.',
  },
  {
    key: 'followup',
    question: 'Any parent or director follow-up needed?',
    hint: 'Flag anything that needs to be communicated to a parent or actioned by the director.',
    placeholder: 'No follow-up needed / Emma\'s parent asked about schedule changes / Director should know about the court issue',
  },
]

const NOTE_LABELS: Record<UnrosteredAttendeeNote, string> = {
  trial: 'Trial class',
  sibling: 'Sibling',
  makeup: 'Makeup class',
  unknown: 'Unknown',
  other: 'Other',
}

// Common non-name capitalized words to exclude from name detection
const COMMON_NON_NAMES = new Set([
  'everyone', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december', 'yes', 'no', 'ok',
  'today', 'tomorrow', 'next', 'last', 'session', 'block', 'coach', 'player',
  'group', 'team', 'all', 'some', 'none', 'one', 'two', 'three', 'four', 'five',
])

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
  const [observationsSaved, setObservationsSaved] = useState<number | null>(null)
  const [observationsError, setObservationsError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [draftRestored, setDraftRestored] = useState(false)
  // "Add note from recap" form state — in summary phase
  const [recapNotePlayer, setRecapNotePlayer] = useState<string>('')
  const [recapNoteType, setRecapNoteType] = useState<'positive' | 'needs_attention'>('positive')
  const [recapNoteText, setRecapNoteText] = useState<string>('')
  const [unrosteredEntries, setUnrosteredEntries] = useState<WrapUpUnrosteredEntry[]>([])
  const [newUnrosteredName, setNewUnrosteredName] = useState('')
  const [newUnrosteredNote, setNewUnrosteredNote] = useState<UnrosteredAttendeeNote>('trial')
  const [attendanceExceptionSaved, setAttendanceExceptionSaved] = useState<number | null>(null)
  const [attendanceExceptionError, setAttendanceExceptionError] = useState<string | null>(null)

  const draftKey = `wrapup_draft_${sessionId}`

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      // First: restore wrap-up draft (recap answers, attendance, phase)
      const raw = localStorage.getItem(draftKey)
      if (raw) {
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
      }
      // Second: if execution client wrote live block statuses, pre-populate (only when no wrap-up draft blockStatus exists)
      const blockStatusRaw = localStorage.getItem(`session_block_status_${sessionId}`)
      if (blockStatusRaw && !JSON.parse(raw ?? '{}').blockStatus) {
        const executionBlockStatus = JSON.parse(blockStatusRaw) as Record<string, 'completed' | 'skipped' | 'modified'>
        if (executionBlockStatus && typeof executionBlockStatus === 'object') {
          setBlockStatus(prev => ({ ...prev, ...executionBlockStatus }))
          setDraftRestored(true)
        }
      }
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

  // Voice output — Sprint 995 V2: routed through donnaPremiumVoiceRuntime (global speech lock).
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Speak current question when voice is enabled or step changes
  useEffect(() => {
    if (!voiceEnabled || phase !== 'questions') {
      stopDonna()
      return
    }
    const questionText = STEPS[stepIndex]?.question ?? ''
    if (questionText) {
      void speakDonnaPremium(questionText, { caller: 'CoachWrapUpDrawer' })
    }
  }, [voiceEnabled, stepIndex, phase])

  // Cancel speech on unmount
  useEffect(() => {
    return () => { stopDonna() }
  }, [])

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
        const obsResult = await saveWrapUpObservationsAction(sessionId, playerObservations, sessionName)
        setObservationsSaved(obsResult.savedCount)
        if (!obsResult.ok || obsResult.error) {
          setObservationsError(`${obsResult.savedCount} of ${playerObservations.length} observation drafts submitted.`)
        }
      }

      // 4. Save attendance exception draft if there are unrostered attendees
      if (unrosteredEntries.length > 0) {
        const exceptResult = await saveWrapUpAttendanceExceptionAction(
          sessionId, sessionName, unrosteredEntries, answers[0] ?? '',
        )
        if (exceptResult.ok) {
          setAttendanceExceptionSaved(unrosteredEntries.length)
        } else {
          setAttendanceExceptionError(exceptResult.error ?? 'Could not submit unexpected attendee draft.')
        }
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
            <p className="text-base font-semibold text-text-primary">Session wrap-up submitted</p>
            <p className="text-sm text-text-muted">
              Your recap is in the director review queue. Nothing official has been changed.
            </p>
            {observationsSaved !== null && observationsSaved > 0 ? (
              <p className="text-xs text-status-green">
                {observationsSaved} player observation draft{observationsSaved !== 1 ? 's' : ''} sent for director review.
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                No player observation drafts were created.
              </p>
            )}
            {observationsError && (
              <p className="text-xs text-status-orange">{observationsError}</p>
            )}
            {attendanceExceptionSaved !== null && attendanceExceptionSaved > 0 && (
              <p className="text-xs text-status-orange">
                {attendanceExceptionSaved} unexpected attendee{attendanceExceptionSaved !== 1 ? 's' : ''} flagged for director review.
              </p>
            )}
            {attendanceExceptionError && (
              <p className="text-xs text-status-orange">{attendanceExceptionError}</p>
            )}
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
  const queuedObsCount = Object.values(playerNotes).filter(n => n.note.trim()).length
  const nextFocusText = answers[5]?.trim()
  const completedBlocks = blocks.filter(b => (blockStatus[b.id] ?? 'completed') === 'completed').length
  const skippedBlocks = blocks.filter(b => blockStatus[b.id] === 'skipped').length
  const modifiedBlocks = blocks.filter(b => blockStatus[b.id] === 'modified').length

  // Name detection — deterministic text matching only, no AI
  const nameGuardrail = useMemo(() => {
    const fullText = answers.join(' ')
    const rosterFirstNames = new Set(
      roster.map(p => p.fullName.split(' ')[0]).filter(n => n.length >= 2)
    )
    const rosterFullNames = new Map(
      roster.map(p => [p.fullName.toLowerCase(), p])
    )
    const rosterFirstNameMap = new Map(
      roster.map(p => [p.fullName.split(' ')[0].toLowerCase(), p])
    )

    // Extract capitalized words (likely names)
    const capitalized = fullText.match(/\b[A-Z][a-z]{1,}/g) ?? []
    const uniqueCapitalized = Array.from(new Set(capitalized))

    const matched: string[] = []
    const unmatched: string[] = []

    for (const word of uniqueCapitalized) {
      const lower = word.toLowerCase()
      if (rosterFirstNameMap.has(lower) || rosterFullNames.has(lower)) {
        matched.push(word)
      } else if (!COMMON_NON_NAMES.has(lower) && rosterFirstNames.size > 0) {
        unmatched.push(word)
      }
    }

    return { matched, unmatched, hasWarning: unmatched.length > 0 }
  }, [answers, roster])

  if (phase === 'summary') {
    return (
      <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
        <div className="flex-1 overflow-y-auto">
          {/* Assistant summary header */}
          <div className="px-5 py-4 border-b border-border space-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-lime/70 mb-0.5">Assistant · Summary</p>
              <p className="text-sm font-semibold text-text-primary">Here's what I understood</p>
              <p className="text-xs text-text-muted mt-0.5">Review before saving. Nothing is official yet.</p>
            </div>
            {/* What will happen summary */}
            <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 space-y-2">
              {blocks.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-lime mt-0.5">→</span>
                  <span className="text-text-secondary">
                    <span className="text-text-primary font-medium">{completedBlocks}</span> blocks completed
                    {skippedBlocks > 0 && <>, <span className="text-status-orange font-medium">{skippedBlocks}</span> skipped</>}
                    {modifiedBlocks > 0 && <>, <span className="text-text-primary font-medium">{modifiedBlocks}</span> modified</>}
                  </span>
                </div>
              )}
              {queuedObsCount > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-lime mt-0.5">→</span>
                  <span className="text-text-secondary">
                    <span className="text-text-primary font-medium">{queuedObsCount}</span> player observation draft{queuedObsCount !== 1 ? 's' : ''} will go to director review
                  </span>
                </div>
              )}
              {unrosteredEntries.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-status-orange mt-0.5">→</span>
                  <span className="text-text-secondary">
                    <span className="text-text-primary font-medium">{unrosteredEntries.length}</span> unexpected attendee draft{unrosteredEntries.length !== 1 ? 's' : ''} will go to director review
                  </span>
                </div>
              )}
              {nextFocusText && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-lime mt-0.5">→</span>
                  <span className="text-text-secondary">Next focus: <span className="text-text-primary">{nextFocusText.slice(0, 60)}{nextFocusText.length > 60 ? '…' : ''}</span></span>
                </div>
              )}
              <div className="flex items-start gap-2 text-xs">
                <span className="text-lime mt-0.5">→</span>
                <span className="text-text-secondary">Wrap-up recap will be saved for <span className="text-text-primary font-medium">director review only</span></span>
              </div>
            </div>
            {/* What will NOT be shared */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-[10px] text-text-muted">
              <span className="text-text-muted mt-0.5 shrink-0">🔒</span>
              <span>
                <span className="text-text-secondary font-medium">Not shared with parents or players:</span> your wrap-up answers, player observations, and block notes. These stay internal.
              </span>
            </div>

            {/* Name guardrail — deterministic text matching only */}
            {(nameGuardrail.matched.length > 0 || nameGuardrail.unmatched.length > 0) && (
              <div className="space-y-2">
                {nameGuardrail.matched.length > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                    <User className="w-3 h-3 shrink-0 mt-0.5 text-text-muted" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] text-text-secondary font-medium">Roster names mentioned</p>
                      <p className="text-[10px] text-text-muted">
                        {nameGuardrail.matched.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {nameGuardrail.unmatched.length > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] text-status-orange font-medium">Name not on roster</p>
                      <p className="text-[10px] text-text-muted leading-snug">
                        <span className="font-medium text-text-secondary">{nameGuardrail.unmatched.join(', ')}</span> — not matched to this session roster. Do not save as a player note unless you confirm who this is.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-4 space-y-5">
            {/* Attendance section — per-player confirmation + unexpected attendees */}
            <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Attendance</p>
                {attendanceSaved && (
                  <span className="text-[10px] text-status-green font-semibold">Saved ✓</span>
                )}
              </div>
              {roster.length > 0 && (
                <>
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
                </>
              )}
              {/* Unexpected attendees — structured capture → attendance_exception proposed_action */}
              <div className={`space-y-2 ${roster.length > 0 ? 'pt-2 border-t border-border' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-text-muted" />
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">Unexpected attendees</p>
                </div>
                <p className="text-[10px] text-text-muted leading-snug">
                  Rostered player attendance is marked directly in the session view above. Use this section only for players who showed up but aren&apos;t on the roster — creates a director review draft. No roster change until approved.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUnrosteredName}
                    onChange={e => setNewUnrosteredName(e.target.value)}
                    placeholder="Name…"
                    maxLength={100}
                    className="flex-1 text-[11px] bg-surface border border-border rounded px-2 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40"
                  />
                  <select
                    value={newUnrosteredNote}
                    onChange={e => setNewUnrosteredNote(e.target.value as UnrosteredAttendeeNote)}
                    className="text-[11px] bg-surface border border-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/40"
                  >
                    <option value="trial">Trial class</option>
                    <option value="sibling">Sibling</option>
                    <option value="makeup">Makeup class</option>
                    <option value="unknown">Unknown</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    disabled={!newUnrosteredName.trim() || unrosteredEntries.length >= 10}
                    onClick={() => {
                      const name = newUnrosteredName.trim()
                      if (!name) return
                      setUnrosteredEntries(prev => [...prev, { name, note: newUnrosteredNote }])
                      setNewUnrosteredName('')
                    }}
                    className="flex items-center gap-1 text-xs btn-lime px-2.5 py-1.5 disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                {unrosteredEntries.length > 0 && (
                  <div className="space-y-1">
                    {unrosteredEntries.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className="text-status-orange">→</span>
                        <span className="text-text-secondary flex-1">
                          {e.name} <span className="text-text-muted">({NOTE_LABELS[e.note]})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setUnrosteredEntries(prev => prev.filter((_, j) => j !== i))}
                          className="text-text-muted hover:text-status-red transition-colors px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <p className="text-[9px] text-text-muted">Sent to director review — no roster change until approved.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add note from recap — assisted player observation draft */}
            {roster.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Add note from recap (optional)</p>
                <p className="text-[10px] text-text-muted leading-snug">
                  Select a player, choose note type, and write or paste text from your recap. Submitted as a draft for director review — not visible to players or parents.
                </p>
                <div className="flex gap-2">
                  <select
                    value={recapNotePlayer}
                    onChange={e => setRecapNotePlayer(e.target.value)}
                    className="flex-1 text-[11px] bg-surface border border-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/40"
                  >
                    <option value="">Select player…</option>
                    {roster.map(p => (
                      <option key={p.playerId} value={p.playerId}>{p.fullName}</option>
                    ))}
                  </select>
                  <select
                    value={recapNoteType}
                    onChange={e => setRecapNoteType(e.target.value as 'positive' | 'needs_attention')}
                    className="text-[11px] bg-surface border border-border rounded px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/40"
                  >
                    <option value="positive">Positive</option>
                    <option value="needs_attention">Needs attention</option>
                  </select>
                </div>
                <textarea
                  value={recapNoteText}
                  onChange={e => setRecapNoteText(e.target.value)}
                  placeholder="Type observation or paste from recap above…"
                  rows={2}
                  className="w-full text-[11px] bg-surface border border-border rounded px-2 py-1.5 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
                />
                <button
                  type="button"
                  disabled={!recapNotePlayer || !recapNoteText.trim()}
                  onClick={() => {
                    const player = roster.find(p => p.playerId === recapNotePlayer)
                    if (!player || !recapNoteText.trim()) return
                    const key = `${recapNotePlayer}:${recapNoteType}`
                    setPlayerNotes(prev => ({
                      ...prev,
                      [key]: {
                        playerId: recapNotePlayer,
                        playerName: player.fullName,
                        note: recapNoteText.trim(),
                        type: recapNoteType,
                      },
                    }))
                    setRecapNoteText('')
                    setRecapNotePlayer('')
                  }}
                  className="flex items-center gap-1.5 text-xs btn-lime px-3 py-1.5 disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                  Add note
                </button>
                {/* Show queued notes */}
                {Object.values(playerNotes).length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border">
                    <p className="text-[9px] uppercase tracking-widest text-text-muted">Queued observations</p>
                    {Object.values(playerNotes).map(n => (
                      <div key={`${n.playerId}:${n.type}`} className="flex items-start gap-2 text-[10px]">
                        <span className={`shrink-0 font-medium ${n.type === 'positive' ? 'text-status-green' : 'text-status-orange'}`}>
                          {n.type === 'positive' ? '+' : '!'}
                        </span>
                        <span className="text-text-secondary truncate">{n.playerName}: {n.note}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                    <p className="text-[9px] text-text-muted">Submitted as observation drafts for director review — not visible to players or parents.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pt-4 pb-safe border-t border-border space-y-3">
          {saveError && (
            <p className="text-xs text-status-red">{saveError}</p>
          )}
          {queuedObsCount > 0 && (
            <p className="text-[10px] text-text-muted px-1">
              {queuedObsCount} player observation draft{queuedObsCount !== 1 ? 's' : ''} queued — will go to director review.
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={isPending}
              className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Edit
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
              {isPending ? 'Submitting…' : 'Submit for Director Review'}
            </button>
          </div>
          {/* Save partial wrap-up — for incomplete flows */}
          {answers.filter(a => a.trim()).length < STEPS.length && (
            <p className="text-[10px] text-text-muted text-center">
              Only answered some questions?{' '}
              <button
                type="button"
                disabled={isPending || !answers.some(a => a.trim())}
                onClick={handleSave}
                className="text-lime underline disabled:opacity-40"
              >
                Save what you have
              </button>
              {' '}— submits your partial recap.
            </p>
          )}
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
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            Question {stepIndex + 1} of {STEPS.length}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-text-muted">Under 60 sec</p>
            {(
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(v => !v)}
                  title={voiceEnabled ? 'Turn off voice' : 'Read questions aloud'}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                    voiceEnabled
                      ? 'border-lime/30 bg-lime/10 text-lime'
                      : 'border-border text-text-muted hover:border-lime/20 hover:text-text-secondary'
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  {voiceEnabled ? 'Voice on' : 'Voice'}
                </button>
                {voiceEnabled && (
                  <button
                    type="button"
                    onClick={() => stopDonna()}
                    title="Stop speaking"
                    className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-lg border border-status-red/30 bg-status-red/5 text-status-red/70 hover:bg-status-red/10 transition-colors"
                  >
                    <Square className="w-2.5 h-2.5" />
                    Stop
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {voiceEnabled && (
          <p className="text-[9px] text-text-muted mt-1">
            Voice output only. You still type or use your device keyboard.
          </p>
        )}
      </div>

      {/* Question content */}
      <div className="flex-1 px-5 space-y-4 overflow-y-auto">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-lime/70 mb-1">Academy OS asks</p>
          <p className="text-base font-semibold text-text-primary leading-snug mb-1.5">
            {currentStep.question}
          </p>
          <p className="text-xs text-text-muted">{currentStep.hint}</p>
        </div>

        {/* Quick-answer shortcuts for yes/no questions */}
        {currentStep.key === 'attendance' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAnswer(stepIndex, 'Everyone was here.'); goNext() }}
              className="flex-1 text-xs py-2 px-3 rounded-xl border border-status-green/30 bg-status-green/5 text-status-green hover:bg-status-green/10 transition-colors"
            >
              ✓ Everyone here
            </button>
            <button
              type="button"
              onClick={() => {
                if (!answers[stepIndex].trim()) setAnswer(stepIndex, 'Someone was missing — ')
              }}
              className="flex-1 text-xs py-2 px-3 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 transition-colors"
            >
              Someone was missing…
            </button>
          </div>
        )}

        {/* Per-player tap grid — attendance step, Mega Sprint 634–663 Loop 7 fix */}
        {currentStep.key === 'attendance' && roster.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-text-muted">Quick mark each player</p>
            <div className="space-y-1.5">
              {roster.map(p => {
                const status = attendanceMap[p.playerId] ?? 'present'
                const chips: Array<{ key: 'present' | 'absent' | 'late' | 'excused'; label: string }> = [
                  { key: 'present',  label: 'P' },
                  { key: 'absent',   label: 'A' },
                  { key: 'late',     label: 'L' },
                  { key: 'excused',  label: 'E' },
                ]
                return (
                  <div key={p.playerId} className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary flex-1 truncate">{p.fullName}</span>
                    <div className="flex gap-1 shrink-0">
                      {chips.map(chip => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setAttendanceMap(prev => ({ ...prev, [p.playerId]: chip.key }))}
                          className={`w-7 h-7 rounded text-[10px] font-bold border transition-colors ${
                            status === chip.key
                              ? chip.key === 'present'
                                ? 'bg-status-green/20 border-status-green text-status-green'
                                : chip.key === 'absent'
                                ? 'bg-status-red/20 border-status-red text-status-red'
                                : chip.key === 'late'
                                ? 'bg-status-orange/20 border-status-orange text-status-orange'
                                : 'bg-status-blue/20 border-status-blue text-status-blue'
                              : 'bg-surface border-border text-text-muted hover:border-lime/30'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[9px] text-text-muted">P=Present · A=Absent · L=Late · E=Excused</p>
          </div>
        )}

        {currentStep.key === 'blocks' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAnswer(stepIndex, 'Yes, all blocks completed.'); goNext() }}
              className="flex-1 text-xs py-2 px-3 rounded-xl border border-status-green/30 bg-status-green/5 text-status-green hover:bg-status-green/10 transition-colors"
            >
              ✓ All completed
            </button>
            <button
              type="button"
              onClick={() => {
                if (!answers[stepIndex].trim()) setAnswer(stepIndex, 'We skipped — ')
              }}
              className="flex-1 text-xs py-2 px-3 rounded-xl border border-border bg-surface-raised text-text-secondary hover:border-lime/30 transition-colors"
            >
              Some were skipped…
            </button>
          </div>
        )}

        <textarea
          value={answers[stepIndex]}
          onChange={e => setAnswer(stepIndex, e.target.value)}
          placeholder={currentStep.placeholder}
          rows={4}
          autoFocus
          className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 resize-none"
        />

        <div className="flex flex-wrap gap-3 items-start">
          <AudioRecorderButton
            sessionId={sessionId}
            onTranscript={transcript => {
              const prev = answers[stepIndex]
              const separator = prev.trim() ? ' ' : ''
              setAnswer(stepIndex, prev + separator + transcript)
            }}
          />
          <div className="text-[9px] text-text-muted self-center">or</div>
          <VoiceInputButton
            onTranscript={transcript => {
              const prev = answers[stepIndex]
              const separator = prev.trim() ? ' ' : ''
              setAnswer(stepIndex, prev + separator + transcript)
            }}
            appendMode
            label="Browser Dictation"
          />
        </div>

        <p className="text-[10px] text-text-muted">
          Tap Next to continue — you can go back at any time. Nothing is saved until you tap Save Recap.
          {(draftRestored || answers.some(a => a.trim())) && (
            <span className="ml-1 text-lime/60">Draft saved locally.</span>
          )}
        </p>
      </div>

      {/* Navigation */}
      <div className="px-5 pt-4 pb-safe border-t border-border flex items-center gap-3">
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
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Assistant · Wrap-Up</p>
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
