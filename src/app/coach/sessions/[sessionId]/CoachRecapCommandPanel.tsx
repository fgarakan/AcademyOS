'use client'

import { useState, useTransition, useMemo } from 'react'
import { CheckCircle, AlertCircle, Zap, ExternalLink, Eye, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import type { SaveSessionRecapInput, SaveSessionRecapResult } from './actions'
import type { StructureCoachRecapResult } from './structureCoachRecapAction'
import { VoiceTextInput } from '@/components/voice/VoiceTextInput'
import { structureVoiceIntake } from '@/lib/voice/structureVoiceIntake'

// Client-side keyword detection for real-time signal preview (UX only — server is authoritative)
const ABSENCE_PHRASES = ['was absent', 'did not show', "didn't show", 'absent today', 'no show', 'not present', 'missed the session', 'not here', "wasn't here", 'did not attend', "didn't attend"]
const LATE_PHRASES = ['arrived late', 'came late', 'was late', 'showed up late', 'turned up late']
const SKILL_KEYWORDS = ['grip', 'preparation', 'forehand', 'backhand', 'serve', 'movement', 'footwork', 'volley', 'slice', 'topspin', 'fitness', 'focus', 'effort', 'speed', 'endurance', 'consistency', 'accuracy', 'power', 'positioning', 'recovery']

function detectClientSignals(text: string) {
  const lower = text.toLowerCase()
  return {
    hasAbsence: ABSENCE_PHRASES.some(p => lower.includes(p)),
    hasLate: LATE_PHRASES.some(p => lower.includes(p)),
    skills: SKILL_KEYWORDS.filter(kw => lower.includes(kw)).slice(0, 5),
  }
}

interface Props {
  sessionId: string
  sessionName: string
  completedCount: number
  totalCount: number
  attendanceSummary: string | null
  initialRecap: string
  saveRecapAction: (input: SaveSessionRecapInput) => Promise<SaveSessionRecapResult>
  structureRecapAction: (voiceNoteId: string, sessionId: string) => Promise<StructureCoachRecapResult>
}

export function CoachRecapCommandPanel({
  sessionId,
  sessionName,
  completedCount,
  totalCount,
  attendanceSummary,
  initialRecap,
  saveRecapAction,
  structureRecapAction,
}: Props) {
  const [recapText, setRecapText] = useState(initialRecap)
  const [voiceNoteId, setVoiceNoteId] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<SaveSessionRecapResult | null>(null)
  const [structureResult, setStructureResult] = useState<StructureCoachRecapResult | null>(null)
  const [isPendingSave, startSaveTransition] = useTransition()
  const [isPendingStructure, startStructureTransition] = useTransition()

  const signals = useMemo(() => detectClientSignals(recapText), [recapText])
  const hasSignals = signals.hasAbsence || signals.hasLate || signals.skills.length > 0
  const saved = saveResult?.ok === true && !!voiceNoteId
  const canStructure = saved && !(structureResult?.ok === true)

  // Client-side voice structure preview (display only — no DB writes)
  const voiceStructure = useMemo(() => {
    if (recapText.trim().length < 15) return null
    return structureVoiceIntake({
      role: 'coach',
      transcript: recapText,
      context: { page: 'coach-session', session_id: sessionId, academy_id: '' },
    })
  }, [recapText, sessionId])

  function handleTextChange(value: string) {
    setRecapText(value)
    setSaveResult(null)
    setVoiceNoteId(null)
    setStructureResult(null)
  }

  function handleSave() {
    setSaveResult(null)
    setStructureResult(null)
    setVoiceNoteId(null)
    startSaveTransition(async () => {
      const res = await saveRecapAction({ sessionId, recapText })
      setSaveResult(res)
      if (res.ok && res.voiceNoteId) {
        setVoiceNoteId(res.voiceNoteId)
      }
    })
  }

  function handleStructure() {
    if (!voiceNoteId) return
    setStructureResult(null)
    startStructureTransition(async () => {
      const res = await structureRecapAction(voiceNoteId, sessionId)
      setStructureResult(res)
    })
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeader title="COACH RECAP" />
        <p className="text-xs text-text-muted mt-1">
          Describe the session in your own words — who was present, what you covered, what you noticed. Structure extracts signals into a director review draft.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">

        {/* Session context */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted pb-1">
          <span>Session: <span className="text-text-secondary">{sessionName}</span></span>
          {totalCount > 0 && (
            <span>Exercises: <span className="font-mono text-lime">{completedCount}/{totalCount} completed</span></span>
          )}
          {attendanceSummary && (
            <span>Attendance: <span className="text-text-secondary">{attendanceSummary}</span></span>
          )}
        </div>

        {/* Recap input — VoiceTextInput with voice capture */}
        <VoiceTextInput
          value={recapText}
          onChange={handleTextChange}
          placeholder="Example: Everyone was here except Sarah. Jeremy showed up late. We worked on forehand grip and preparation. Lucas recovered better after wide balls."
          minRows={5}
          helperText="Voice creates text. Save recap, then structure into a director review draft."
        />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-text-muted">{recapText.length}/2000</p>
          {hasSignals && (
            <span className="text-[10px] text-lime/70 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Signals detected
            </span>
          )}
        </div>

        {/* Real-time signal preview */}
        {hasSignals && (
          <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Detected Signals (Preview)</p>
            <div className="flex flex-wrap gap-1.5">
              {signals.hasAbsence && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-status-red/10 border border-status-red/20 text-status-red">Absence mention</span>
              )}
              {signals.hasLate && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-status-orange/10 border border-status-orange/20 text-status-orange">Late arrival mention</span>
              )}
              {signals.skills.map(skill => (
                <span key={skill} className="px-2 py-0.5 rounded-full text-[10px] bg-lime/10 border border-lime/20 text-lime">{skill}</span>
              ))}
            </div>
            <p className="text-[10px] text-text-muted">Preview only — server structuring extracts player-level signals for director review.</p>
          </div>
        )}

        {/* Coach voice structure preview — display only, no DB writes */}
        {voiceStructure && voiceStructure.draft.detected_intents[0] !== 'unknown' && (
          <CoachVoiceStructureDisplay result={voiceStructure} />
        )}

        {/* Save result */}
        {saveResult && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs ${
            saveResult.ok
              ? 'bg-status-green/10 border border-status-green/30 text-status-green'
              : 'bg-status-red/10 border border-status-red/30 text-status-red'
          }`}>
            {saveResult.ok ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span>
              {saveResult.ok
                ? 'Recap saved. Use "Structure Now" to extract signals into a director review draft.'
                : (saveResult.error ?? 'Unknown error.')}
            </span>
          </div>
        )}

        {/* Structure result */}
        {structureResult && (
          <div className={`px-3 py-2.5 rounded-xl text-xs space-y-2 ${
            structureResult.ok
              ? 'bg-lime/5 border border-lime/20'
              : 'bg-status-red/10 border border-status-red/30'
          }`}>
            {structureResult.ok ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-lime shrink-0" />
                  <span className="text-lime font-medium">Structured draft created</span>
                </div>
                {structureResult.attendanceMentions.length > 0 && (
                  <div>
                    <p className="text-text-muted mb-1">Attendance signals:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {structureResult.attendanceMentions.map((m, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] border ${
                          m.status === 'absent'
                            ? 'bg-status-red/10 border-status-red/20 text-status-red'
                            : 'bg-status-orange/10 border-status-orange/20 text-status-orange'
                        }`}>
                          {m.player_name} — {m.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {structureResult.observationCount > 0 && (
                  <p className="text-text-secondary">
                    {structureResult.observationCount} player observation draft{structureResult.observationCount !== 1 ? 's' : ''} extracted.
                  </p>
                )}
                <p className="text-text-muted text-[10px]">All fields require director review — no records updated.</p>
                <a
                  href="/director/review"
                  className="inline-flex items-center gap-1 text-lime text-[11px] hover:underline"
                >
                  View in Director Review Queue <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
                <span className="text-status-red">{structureResult.error ?? 'Structuring failed.'}</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPendingSave || !recapText.trim()}
            className="flex-1 btn-lime disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPendingSave ? 'Saving…' : 'Save Recap'}
          </button>
          {canStructure && (
            <button
              type="button"
              onClick={handleStructure}
              disabled={isPendingStructure}
              className="flex-1 btn-lime disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              {isPendingStructure ? 'Structuring…' : 'Structure Now'}
            </button>
          )}
        </div>

      </CardContent>
    </Card>
  )
}

// ── Coach Voice Structure Display ─────────────────────────────────────────────
// Display-only. No DB writes. Shows what structureVoiceIntake() detected from the recap.

import type { VoiceIntakeStructureResult } from '@/lib/voice/voiceIntakeTypes'

const COACH_INTENT_DISPLAY: Record<string, string> = {
  record_attendance_exception: 'Attendance exception',
  flag_unrostered_attendee: 'Unrostered attendee',
  create_player_observation: 'Player observation',
  create_gate_evidence_draft: 'Gate evidence candidate',
  create_session_recap: 'Session recap',
  create_gap_signal: 'Training gap signal',
  create_parent_safe_candidate: 'Parent safe candidate',
  alert_director: 'Director alert',
}

function CoachVoiceStructureDisplay({ result }: { result: VoiceIntakeStructureResult }) {
  const { draft } = result
  const coachIntents = draft.detected_intents.filter(i => COACH_INTENT_DISPLAY[i])
  const hasContent = coachIntents.length > 0 || draft.affected_players.length > 0 || draft.gap_links.length > 0

  if (!hasContent) return null

  return (
    <div className="rounded-xl border border-lime/15 bg-lime/3 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] uppercase tracking-widest text-lime/70">Voice Structure Preview</p>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <ShieldCheck className="w-3 h-3 text-lime/60" />
          Review draft only — not visible to players
        </div>
      </div>

      {/* Detected coach intents */}
      {coachIntents.length > 0 && (
        <div>
          <p className="text-[10px] text-text-muted mb-1.5">Detected</p>
          <div className="flex flex-wrap gap-1.5">
            {coachIntents.map(intent => (
              <span key={intent} className="px-2 py-0.5 rounded-full border border-lime/20 bg-lime/5 text-[10px] text-lime">
                {COACH_INTENT_DISPLAY[intent]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Player mentions */}
      {draft.affected_players.length > 0 && (
        <div>
          <p className="text-[10px] text-text-muted mb-1">Players mentioned</p>
          <div className="flex flex-wrap gap-1.5">
            {draft.affected_players.map(p => (
              <span key={p} className="px-2 py-0.5 rounded-full border border-border text-[10px] text-text-secondary">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Gap signals */}
      {draft.gap_links.length > 0 && (
        <div>
          <p className="text-[10px] text-text-muted mb-1">Gap signals</p>
          <div className="flex flex-wrap gap-1.5">
            {draft.gap_links.map(g => (
              <span key={g} className="px-2 py-0.5 rounded-full border border-border text-[10px] text-text-muted">{g.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* What would not change */}
      <div className="pt-1 border-t border-lime/10">
        <p className="text-[10px] text-text-muted">
          No parent message sent · No level change · No roster change — all require director approval
        </p>
      </div>
    </div>
  )
}
