'use client'

// Sprint 1042 — DONNA Coach Wrap-Up Integration Polish V1
// Sprint 927 — Coach Wrap-Up 10/10 V1
// Added: voice input per question (AudioRecorderButton + VoiceInputButton),
// player name quick-chips on standouts/attention questions,
// optional player observation draft form in saved state.

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Check, Loader2, Sparkles, SkipForward, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { AudioRecorderButton } from '@/components/assistant/AudioRecorderButton'
import { VoiceInputButton } from '@/components/assistant/VoiceInputButton'
import { saveWrapUpDraftAction, type BlockCompletionDraft } from '../saveWrapUpDraftAction'
import { saveWrapUpObservationsAction } from '../saveWrapUpObservationsAction'

// ── Question definitions ──────────────────────────────────────

interface Question {
  key: string
  question: string
  hint: string
  placeholder: string
}

const QUESTIONS: Question[] = [
  {
    key: 'overall',
    question: 'How did the session go overall?',
    hint: 'A quick summary — energy, flow, what worked.',
    placeholder: 'Great session. High energy, group was focused...',
  },
  {
    key: 'attendance',
    question: 'Any attendance exceptions?',
    hint: 'Absences, late arrivals, early departures, or players not on the roster.',
    placeholder: 'Everyone was here / Max was absent / A new player showed up',
  },
  {
    key: 'standouts',
    question: 'Any players stand out positively today?',
    hint: 'Skill breakthroughs, great effort, focus.',
    placeholder: 'Lucas was exceptional on serve. Emma showed real improvement.',
  },
  {
    key: 'attention',
    question: 'Any players need extra attention next time?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Check in with Max.',
  },
  {
    key: 'adjust',
    question: 'Anything to adjust for next time?',
    hint: 'Changes to blocks, drills, pacing, or group dynamic.',
    placeholder: 'Shorten the warm-up. Add more game-based drilling at the end.',
  },
  {
    key: 'followup',
    question: 'Any parent or director follow-up needed?',
    hint: 'Flag anything that needs to be communicated or actioned.',
    placeholder: 'No follow-up needed / Emma\'s parent asked about schedule changes',
  },
]

// ── Types ─────────────────────────────────────────────────────

interface RosterPlayer {
  id: string
  fullName: string
  firstName: string
}

interface Props {
  sessionId: string
  sessionName: string
  blockList: Array<{ id: string; name: string }>
  returnHref: string
  roster?: RosterPlayer[]
}

type Phase = 'questions' | 'saved'
type ObsType = 'positive' | 'needs_attention'
interface ObsEntry { type: ObsType; note: string }

// ── Main client component ────────────────────────────────────

export function WrapUpPageClient({ sessionId, sessionName, blockList, returnHref, roster = [] }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const q of QUESTIONS) init[q.key] = ''
    return init
  })
  const [phase, setPhase] = useState<Phase>('questions')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Observation drafts — optional, shown in saved state
  const [obsMap, setObsMap] = useState<Record<string, ObsEntry>>({})
  const [obsPhase, setObsPhase] = useState<'idle' | 'saved'>('idle')
  const [obsSaved, setObsSaved] = useState(0)
  const [obsError, setObsError] = useState<string | null>(null)
  const [obsIsPending, startObsTransition] = useTransition()

  const currentQuestion = QUESTIONS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === QUESTIONS.length - 1
  const answered = QUESTIONS.filter(q => answers[q.key]?.trim()).length

  function goNext() { if (!isLast) setStepIndex(i => i + 1) }
  function goPrev() { if (!isFirst) setStepIndex(i => i - 1) }
  function skip() { if (!isLast) setStepIndex(i => i + 1) }

  // Append transcript to the current question answer
  function appendToAnswer(key: string, transcript: string) {
    setAnswers(prev => {
      const cur = prev[key] ?? ''
      const sep = cur.trim() ? ' ' : ''
      return { ...prev, [key]: cur + sep + transcript }
    })
  }

  // Append a player's first name to the current answer (quick-chip tap)
  function appendPlayerName(key: string, firstName: string) {
    setAnswers(prev => {
      const cur = prev[key] ?? ''
      const sep = cur.trim()
        ? (cur.trim().endsWith('.') || cur.trim().endsWith(',') ? ' ' : ', ')
        : ''
      return { ...prev, [key]: cur + sep + firstName }
    })
  }

  // Cycle observation type for a player: none → positive → needs_attention → none
  function cycleObsType(playerId: string) {
    setObsMap(prev => {
      const existing = prev[playerId]
      if (!existing) return { ...prev, [playerId]: { type: 'positive', note: '' } }
      if (existing.type === 'positive') return { ...prev, [playerId]: { ...existing, type: 'needs_attention' } }
      const next = { ...prev }
      delete next[playerId]
      return next
    })
  }

  function setObsNote(playerId: string, note: string) {
    setObsMap(prev => {
      if (!prev[playerId]) return prev
      return { ...prev, [playerId]: { ...prev[playerId], note } }
    })
  }

  function handleSubmitObs() {
    const observations = Object.entries(obsMap)
      .filter(([, v]) => v.note.trim())
      .map(([playerId, v]) => {
        const player = roster.find(p => p.id === playerId)
        return {
          playerId,
          playerName: player?.fullName ?? '',
          note: v.note.trim(),
          observationType: v.type as ObsType,
        }
      })
    if (observations.length === 0) return
    setObsError(null)
    startObsTransition(async () => {
      const result = await saveWrapUpObservationsAction(sessionId, observations, sessionName)
      if (result.ok) {
        setObsSaved(result.savedCount)
        setObsPhase('saved')
      } else {
        setObsError(result.error ?? 'Failed to save player notes.')
      }
    })
  }

  function handleSave() {
    setSaveError(null)
    const blockCompletion: BlockCompletionDraft[] = blockList.map(b => ({
      block_id: b.id,
      block_name: b.name,
      status: 'completed' as const,
      note: '',
    }))

    startTransition(async () => {
      const result = await saveWrapUpDraftAction(
        sessionId,
        sessionName,
        blockCompletion,
        {
          attendance: answers.attendance ?? '',
          changes: answers.adjust ?? '',
          standouts: answers.standouts ?? '',
          attention: answers.attention ?? '',
          nextFocus: answers.followup ?? '',
          groupNote: answers.overall ?? '',
        }
      )
      if (result.ok) {
        setPhase('saved')
      } else {
        setSaveError(result.error ?? 'Failed to save wrap-up. Please try again.')
      }
    })
  }

  // ── Saved state ──────────────────────────────────────────────

  if (phase === 'saved') {
    const hasObsWithNote = Object.values(obsMap).some(v => v.note.trim())
    const obsCount = Object.keys(obsMap).length

    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-start px-4 pt-10 pb-10 space-y-5">
        {/* DONNA submitted state */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
          </div>
          <span className="text-sm font-semibold text-lime">DONNA</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-status-blue/10 text-status-blue border-status-blue/20">Coach</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-status-green" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary">Wrap-up submitted for review</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed max-w-xs mx-auto">
            Your wrap-up draft is in the director review queue. Nothing has been sent to parents or applied to player profiles.
          </p>
        </div>
        <div className="flex items-start gap-2 max-w-xs w-full px-3 py-2.5 rounded-xl border border-lime/15 bg-lime/4 text-left">
          <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-secondary leading-relaxed">
            The director will review and approve before any information reaches parents or becomes part of the official player record.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link
            href={`/coach/sessions/${sessionId}/wrap-up/review`}
            className="px-5 py-3 rounded-xl bg-lime text-black text-sm font-bold hover:bg-lime/90 transition-all text-center"
          >
            Review Submitted Draft
          </Link>
          <Link
            href={returnHref}
            className="px-5 py-3 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-raised transition-all text-center"
          >
            Back to Session
          </Link>
          <Link
            href="/coach/donna"
            className="px-5 py-3 rounded-xl text-sm text-text-muted hover:text-text-secondary transition-all text-center flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask DONNA
          </Link>
        </div>

        {/* ── Optional player observation drafts ── */}
        {roster.length > 0 && obsPhase !== 'saved' && (
          <div className="w-full max-w-xs pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Add player notes (optional)</p>
            </div>
            <p className="text-[10px] text-text-muted leading-snug">
              Tap a player to flag as positive or needing attention. Add a note, then submit — goes to director review only. Not visible to players or parents.
            </p>
            <div className="space-y-2">
              {roster.map(player => {
                const obs = obsMap[player.id]
                return (
                  <div key={player.id} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-primary flex-1 truncate">{player.firstName}</span>
                      <button
                        type="button"
                        onClick={() => cycleObsType(player.id)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors shrink-0 ${
                          !obs
                            ? 'border-border text-text-muted hover:border-lime/30 hover:text-text-secondary'
                            : obs.type === 'positive'
                            ? 'border-status-green/30 bg-status-green/10 text-status-green'
                            : 'border-status-orange/30 bg-status-orange/10 text-status-orange'
                        }`}
                      >
                        {!obs ? '+ Note' : obs.type === 'positive' ? '✓ Positive' : '! Needs attention'}
                      </button>
                    </div>
                    {obs && (
                      <input
                        type="text"
                        value={obs.note}
                        onChange={e => setObsNote(player.id, e.target.value)}
                        placeholder={obs.type === 'positive' ? 'What stood out?' : 'What needs attention?'}
                        className="w-full text-[11px] bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40"
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {obsError && (
              <p className="text-[10px] text-status-red text-center">{obsError}</p>
            )}
            {obsCount > 0 && (
              <button
                type="button"
                onClick={handleSubmitObs}
                disabled={obsIsPending || !hasObsWithNote}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-lime/10 border border-lime/20 text-xs font-semibold text-lime hover:bg-lime/20 transition-colors disabled:opacity-40"
              >
                {obsIsPending
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Submitting…</>
                  : <><Check className="w-3 h-3" /> Submit player notes for review</>
                }
              </button>
            )}
          </div>
        )}

        {/* Observation saved confirmation */}
        {obsPhase === 'saved' && obsSaved > 0 && (
          <div className="w-full max-w-xs flex items-center gap-2 px-3 py-2.5 rounded-xl border border-status-green/30 bg-status-green/10">
            <Check className="w-3.5 h-3.5 text-status-green shrink-0" />
            <p className="text-[10px] text-status-green leading-snug">
              {obsSaved} player note{obsSaved !== 1 ? 's' : ''} submitted for director review.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── Question step ────────────────────────────────────────────

  const isStandoutsOrAttention = currentQuestion.key === 'standouts' || currentQuestion.key === 'attention'
  const showPlayerChips = isStandoutsOrAttention && roster.length > 0

  return (
    <div className="min-h-screen bg-base flex flex-col max-w-lg mx-auto px-4 py-6">

      {/* DONNA header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={returnHref}
          className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          {sessionName}
        </Link>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-lime" />
          </div>
          <span className="text-[11px] font-semibold text-lime">DONNA</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-status-blue/10 text-status-blue border-status-blue/20">Coach</span>
          <span className="text-[10px] text-text-muted ml-1">{stepIndex + 1}/{QUESTIONS.length}</span>
        </div>
      </div>

      {/* Progress rail */}
      <div className="flex gap-1 mb-5">
        {QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStepIndex(i)}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              i < stepIndex ? 'bg-status-green' :
              i === stepIndex ? 'bg-lime' :
              'bg-surface-raised'
            }`}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>

      {/* DONNA prompt */}
      <div className="flex items-start gap-2.5 mb-4 px-3 py-2.5 rounded-xl border border-border bg-surface">
        <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-lime" />
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {stepIndex === 0
            ? "Let's wrap this up. Quick answers — I'll build the draft as you go. Nothing is sent until the director reviews it."
            : currentQuestion.key === 'attendance'
            ? "Any exceptions to normal attendance? Absences, late arrivals, or unregistered players?"
            : currentQuestion.key === 'standouts'
            ? "Any players who showed a breakthrough today? Name them — it goes into their record."
            : currentQuestion.key === 'attention'
            ? "Who needs more support next session? Be specific — this helps the director prioritize."
            : currentQuestion.key === 'adjust'
            ? "What would you change about today's plan for next time? Pacing, drills, energy?"
            : currentQuestion.key === 'followup'
            ? "Any items that need director or parent attention? Flag them here."
            : answered >= QUESTIONS.length - 2
            ? "Almost done. Your draft is ready to submit."
            : "Keep going — your draft is building below."}
        </p>
      </div>

      {/* Question card */}
      <div className="flex-1 rounded-2xl border border-border bg-surface p-5 space-y-4" data-donna-focus-id="wrapup-question-card">
        <div>
          <h2 className="text-lg font-bold text-text-primary leading-snug">
            {currentQuestion.question}
          </h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{currentQuestion.hint}</p>
        </div>

        {/* Player name quick-chips — standouts and attention questions only */}
        {showPlayerChips && (
          <div className="space-y-1.5">
            <p className="text-[9px] uppercase tracking-widest text-text-muted">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {roster.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => appendPlayerName(currentQuestion.key, p.firstName)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-lime transition-colors"
                >
                  {p.firstName}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={answers[currentQuestion.key] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.key]: e.target.value }))}
          placeholder={currentQuestion.placeholder}
          className="w-full rounded-xl bg-surface-raised border border-border px-3 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
          rows={4}
          autoFocus
        />

        {/* Voice input — appends transcript to current answer */}
        <div className="space-y-2 pt-1 border-t border-border/50">
          <p className="text-[9px] uppercase tracking-widest text-text-muted">Voice input</p>
          <div className="flex flex-wrap gap-3 items-start">
            <AudioRecorderButton
              sessionId={sessionId}
              onTranscript={transcript => appendToAnswer(currentQuestion.key, transcript)}
            />
            <span className="text-[9px] text-text-muted self-center">or</span>
            <VoiceInputButton
              onTranscript={transcript => appendToAnswer(currentQuestion.key, transcript)}
              appendMode
              label="Browser Dictation"
            />
          </div>
        </div>

        {/* Running answer summary */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-text-muted">{answered} of {QUESTIONS.length} answered</p>
          <div className="flex flex-wrap gap-1">
            {QUESTIONS.map((q, i) => (
              <span
                key={q.key}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  answers[q.key]?.trim()
                    ? 'border-status-green/30 bg-status-green/10 text-status-green'
                    : i === stepIndex
                    ? 'border-lime/30 bg-lime/5 text-lime'
                    : 'border-border text-text-muted'
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Running structured summary */}
      {answered > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted">DONNA Summary Draft</p>
          </div>
          <div className="space-y-2">
            {QUESTIONS.map(q => {
              const val = answers[q.key]?.trim()
              if (!val) return null
              return (
                <div key={q.key}>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">
                    {q.key === 'overall' ? 'Session Overview' :
                     q.key === 'attendance' ? 'Attendance' :
                     q.key === 'standouts' ? 'Positive Standouts' :
                     q.key === 'attention' ? 'Needs Extra Attention' :
                     q.key === 'adjust' ? 'Next Session Adjustments' :
                     'Follow-Up Items'}
                  </p>
                  <p className="text-xs text-text-secondary leading-snug line-clamp-2">{val}</p>
                </div>
              )
            })}
          </div>
          <p className="text-[9px] text-text-muted leading-snug">
            Draft only — submitted for director review. Nothing sent to parents or applied to player profiles.
          </p>
        </div>
      )}

      {/* Error */}
      {saveError && (
        <p className="text-xs text-status-red mt-3 text-center">{saveError}</p>
      )}

      {/* Early submit — available once at least one answer exists and not on last question */}
      {answered > 0 && !isLast && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-[10px] text-text-muted">{answered} answer{answered !== 1 ? 's' : ''} captured</p>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/20 bg-lime/5 text-lime hover:bg-lime/10 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Submit early
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-4" data-donna-focus-id="wrapup-nav-actions">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-raised transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={skip}
          disabled={isLast}
          className="flex items-center gap-1 px-3 py-3 rounded-xl border border-border text-xs text-text-muted disabled:opacity-30 hover:bg-surface-raised transition-all"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
        <div className="flex-1" />
        {isLast ? (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-lime text-base font-bold text-black hover:bg-lime/90 disabled:opacity-60 transition-all"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Submit for Review
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-lime text-base font-bold text-black hover:bg-lime/90 transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  )
}
