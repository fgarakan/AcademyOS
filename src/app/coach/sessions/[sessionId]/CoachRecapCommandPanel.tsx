'use client'

import { useState, useTransition, useMemo } from 'react'
import { CheckCircle, AlertCircle, Zap, ExternalLink, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import type { SaveSessionRecapInput, SaveSessionRecapResult } from './actions'
import type { StructureCoachRecapResult } from './structureCoachRecapAction'

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

        {/* Recap textarea */}
        <textarea
          value={recapText}
          onChange={e => handleTextChange(e.target.value)}
          placeholder="Example: Everyone was here except Sarah. Jeremy showed up late. We worked on forehand grip and preparation. Lucas recovered better after wide balls. Maria was inconsistent on serve but showed great effort."
          rows={5}
          maxLength={5000}
          className="w-full text-sm bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50 transition-colors"
        />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-text-muted">{recapText.length}/5,000</p>
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
