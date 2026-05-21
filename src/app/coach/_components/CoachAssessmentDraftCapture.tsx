'use client'

// Sprint 589 — Coach Voice-to-Assessment Draft UI V1
// Coach speaks/types freely; DONNA structures it into assessment rubric selections.
// Uses voiceStructuring.ts from Phase 3 assessment library.
// Coach must review/edit/confirm before submission. No official writes.

import { useState } from 'react'
import { X, ClipboardList, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import {
  structureVoiceAssessmentInput,
  voiceDraftToAssessmentDomainScore,
  type VoiceAssessmentDraft,
} from '@/lib/assessments/voiceStructuring'
import { ASSESSMENT_DOMAIN_LABELS } from '@/lib/assessments/index'
import type { AssessmentDomainScore } from '@/lib/assessments/index'

interface Props {
  onClose: () => void
  onDraftSaved?: (draft: { playerName: string; domainScore: AssessmentDomainScore; rawInput: string }) => void
}

const EXAMPLE_INPUTS = [
  'Marcus is showing solid forehand consistency — about a 6 or 7 out of 10. Unit turn is there, contact point is good.',
  'Emma is struggling with error response — she dwells on mistakes for 10-15 seconds. Around a 3 for mental performance.',
  'Jake has very good competition experience — around 5 or 6, competes locally, knows scoring well.',
  'Tyler movement is excellent. Quick split step, great lateral recovery. I\'d say 8 out of 10 for fitness.',
]

type Stage = 'input' | 'review' | 'confirmed'

export function CoachAssessmentDraftCapture({ onClose, onDraftSaved }: Props) {
  const [stage, setStage] = useState<Stage>('input')
  const [playerName, setPlayerName] = useState('')
  const [input, setInput] = useState('')
  const [structured, setStructured] = useState<VoiceAssessmentDraft | null>(null)
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null)

  function handleStructure() {
    if (!input.trim()) return
    const result = structureVoiceAssessmentInput(input.trim())
    setStructured(result)
    setAdjustedScore(result.extractedScore)
    setStage('review')
  }

  function handleConfirm() {
    if (!structured) return
    const effectiveScore = adjustedScore ?? structured.extractedScore
    if (!effectiveScore || !structured.detectedDomain) return

    const updated: VoiceAssessmentDraft = {
      ...structured,
      extractedScore: effectiveScore,
    }
    const domainScore = voiceDraftToAssessmentDomainScore(updated)
    if (domainScore) {
      onDraftSaved?.({ playerName: playerName.trim(), domainScore, rawInput: input.trim() })
    }
    setStage('confirmed')
  }

  if (stage === 'confirmed') {
    return (
      <AssessmentShell onClose={onClose}>
        <ConfirmedView
          playerName={playerName}
          structured={structured}
          adjustedScore={adjustedScore}
          onReset={() => { setPlayerName(''); setInput(''); setStructured(null); setStage('input') }}
          onClose={onClose}
        />
      </AssessmentShell>
    )
  }

  if (stage === 'review' && structured) {
    return (
      <AssessmentShell onClose={onClose}>
        <ReviewView
          playerName={playerName}
          structured={structured}
          adjustedScore={adjustedScore}
          onAdjustScore={setAdjustedScore}
          onBack={() => setStage('input')}
          onConfirm={handleConfirm}
        />
      </AssessmentShell>
    )
  }

  return (
    <AssessmentShell onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Describe what you observed. DONNA will identify the assessment domain and score band.
          You review and confirm before anything is saved.
        </p>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Player name *</p>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="First name or full name…"
            autoFocus
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Observation *</p>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='Describe what you observed in plain language. Include a score estimate if you have one (e.g. "around a 6")…'
            rows={5}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Try an example</p>
          {EXAMPLE_INPUTS.map(ex => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="w-full text-left px-3 py-2 rounded-lg border border-border bg-surface text-[11px] text-text-muted hover:border-lime/30 hover:text-text-secondary transition-colors flex items-center gap-2"
            >
              <ChevronRight className="w-3 h-3 shrink-0 text-lime/50" />
              <span className="line-clamp-2">{ex}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleStructure}
          disabled={!input.trim() || !playerName.trim()}
          className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Structure with DONNA
        </button>

        <p className="text-[10px] text-text-muted/70 text-center">
          No AI API — uses keyword matching. You review everything before confirming.
        </p>
      </div>
    </AssessmentShell>
  )
}

function ReviewView({
  playerName,
  structured,
  adjustedScore,
  onAdjustScore,
  onBack,
  onConfirm,
}: {
  playerName: string
  structured: VoiceAssessmentDraft
  adjustedScore: number | null
  onAdjustScore: (n: number) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const effectiveScore = adjustedScore ?? structured.extractedScore
  const canConfirm = !!structured.detectedDomain && effectiveScore !== null

  return (
    <div className="space-y-4">
      {/* DONNA comment */}
      <div className="rounded-xl border border-status-blue/20 bg-status-blue/5 px-4 py-3">
        <p className="text-[10px] text-status-blue/70 mb-0.5">DONNA says</p>
        <p className="text-[12px] text-text-secondary leading-relaxed">{structured.donnaComment}</p>
      </div>

      {/* Structured result */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Structured result</p>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
            structured.confidence === 'high'
              ? 'border-status-green/30 text-status-green'
              : structured.confidence === 'medium'
                ? 'border-status-orange/30 text-status-orange'
                : 'border-status-red/30 text-status-red'
          }`}>
            {structured.confidence} confidence
          </span>
        </div>

        {playerName && (
          <p className="text-[11px] text-text-secondary">
            Player: <span className="font-medium text-text-primary">{playerName}</span>
          </p>
        )}

        {structured.detectedDomain ? (
          <p className="text-[11px] text-text-secondary">
            Domain: <span className="font-medium text-lime">{ASSESSMENT_DOMAIN_LABELS[structured.detectedDomain]}</span>
          </p>
        ) : (
          <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-status-red/5 border border-status-red/20">
            <AlertTriangle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
            <p className="text-[10px] text-status-red">Domain not detected. Please go back and include more specific language (skill, competition, fitness, or mental).</p>
          </div>
        )}

        {/* Score adjustment */}
        <div>
          <p className="text-[10px] text-text-muted mb-1.5">
            Score (1–10)
            {structured.extractedScore !== null && (
              <span className="ml-1 text-text-muted/60">
                — DONNA detected: {structured.extractedScore}
              </span>
            )}
          </p>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => onAdjustScore(n)}
                className={`w-7 h-7 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                  effectiveScore === n
                    ? 'bg-lime text-base border-lime'
                    : 'border-border bg-surface text-text-muted hover:border-lime/30'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {structured.extractedBand && (
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] font-medium text-lime">{structured.extractedBand.label}</p>
            <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
              {structured.extractedBand.description}
            </p>
          </div>
        )}
      </div>

      {structured.requiresReview && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-status-orange/20 bg-status-orange/5">
          <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            This assessment note needs review before submission. Check domain and score are correct.
            <span className="block mt-0.5 font-medium text-status-orange">Nothing official changes until the director approves the full assessment.</span>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 btn-ghost">Edit input</button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="flex-1 btn-lime disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Draft
        </button>
      </div>
    </div>
  )
}

function ConfirmedView({
  playerName,
  structured,
  adjustedScore,
  onReset,
  onClose,
}: {
  playerName: string
  structured: VoiceAssessmentDraft | null
  adjustedScore: number | null
  onReset: () => void
  onClose: () => void
}) {
  const score = adjustedScore ?? structured?.extractedScore
  const band = structured?.extractedBand

  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      <div className="w-12 h-12 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-lime" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Assessment draft captured</p>
        {playerName && (
          <p className="text-xs text-text-muted mt-0.5">{playerName}</p>
        )}
        {structured?.detectedDomain && (
          <p className="text-xs text-lime mt-0.5">
            {ASSESSMENT_DOMAIN_LABELS[structured.detectedDomain]}
            {score !== null && ` — ${score}/10`}
            {band ? ` (${band.label})` : ''}
          </p>
        )}
      </div>
      <div className="px-4 py-3 rounded-xl border border-lime/20 bg-lime/5 text-left w-full">
        <p className="text-[10px] text-text-muted leading-relaxed">
          Saved as a local assessment draft. Submit via session wrap-up for director review.
          <span className="block mt-1 font-medium text-text-secondary">No official player record has been changed.</span>
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <button onClick={onReset} className="flex-1 btn-ghost">Capture another</button>
        <button onClick={onClose} className="flex-1 btn-lime">Done</button>
      </div>
    </div>
  )
}

function AssessmentShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-lime/70">DONNA</p>
            <p className="text-sm font-semibold text-text-primary">Assessment Draft</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {children}
      </div>
    </div>
  )
}
