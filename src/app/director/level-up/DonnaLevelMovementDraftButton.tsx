'use client'

// Sprint 605 — DONNA Level Movement Draft Button
// Entry point for director to request a DONNA level readiness review draft.
// Calls saveLevelReadinessDraftAction — creates a proposed_actions row only.
// NEVER directly moves a player level.
// NEVER updates player_curriculum_states or players tables.
// NEVER creates parent/player-visible changes.
// Designed for compatibility with a future universal DONNA action registry pattern.

import { useState, useTransition } from 'react'
import { Sparkles, CheckCircle2, AlertTriangle, Loader2, ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { saveLevelReadinessDraftAction } from '@/app/director/_actions/donnaDirectorIntelligenceActions'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'

// ---------------------------------------------------------------------------
// Props
// Typed to match what the pipeline view provides. currentTrackHint is an
// inferred hint from current_track — not a guaranteed curriculum level name.
// Compatible with a future DonnaActionConfig registry shape.
// ---------------------------------------------------------------------------

export interface DonnaLevelMovementDraftButtonProps {
  playerId: string
  playerName: string
  /** Inferred from v_reassessment_pipeline.current_track — editable hint only */
  currentTrackHint: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trackToLevelHint(track: string | null): string {
  if (!track) return ''
  return track.charAt(0).toUpperCase() + track.slice(1)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DonnaLevelMovementDraftButton({
  playerId,
  playerName,
  currentTrackHint,
}: DonnaLevelMovementDraftButtonProps) {
  const [open, setOpen] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(trackToLevelHint(currentTrackHint))
  const [nextLevel, setNextLevel] = useState('')
  const [gateEvidence, setGateEvidence] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<DonnaApprovalExecutionResult | null>(null)

  function handleSubmit() {
    if (!currentLevel.trim() || !nextLevel.trim()) return
    startTransition(async () => {
      const res = await saveLevelReadinessDraftAction({
        _resolved_player_id: playerId,
        player: playerName,
        current_level: currentLevel.trim(),
        next_level: nextLevel.trim(),
        gate_evidence: gateEvidence.trim(),
      })
      setResult(res)
    })
  }

  function handleReset() {
    setOpen(false)
    setResult(null)
    setCurrentLevel(trackToLevelHint(currentTrackHint))
    setNextLevel('')
    setGateEvidence('')
  }

  // ── Collapsed trigger ────────────────────────────────────────────────────

  if (!open) {
    return (
      <div className="px-4 py-2 border-t border-border/40">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-lime transition-colors"
          title={`Ask DONNA to draft a level advancement review for ${playerName}`}
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          Ask DONNA to draft level advancement
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>
    )
  }

  // ── Expanded panel ───────────────────────────────────────────────────────

  return (
    <div className="px-4 pb-4 pt-3 border-t border-border/40 space-y-3">

      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">
            Draft level review with DONNA
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Close
        </button>
      </div>

      {/* Result state */}
      {result ? (
        result.ok ? (
          // Success
          <div className="rounded-lg px-3 py-2.5 space-y-1.5 bg-status-green/5 border border-status-green/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-px" />
              <p className="text-xs text-status-green font-medium leading-snug">
                DONNA drafted this level movement for director review. No player level has changed yet.
              </p>
            </div>
            {result.safetyNotes?.slice(0, 3).map((note, i) => (
              <p key={i} className="text-[10px] text-text-muted pl-5 leading-snug">• {note}</p>
            ))}
            <Link
              href="/director/review"
              className="inline-flex items-center gap-1 text-[10px] text-lime hover:opacity-80 transition-opacity pl-5 mt-0.5"
            >
              Review in queue <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        ) : (
          // Error
          <div className="rounded-lg px-3 py-2.5 space-y-1.5 bg-status-red/5 border border-status-red/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-red shrink-0 mt-px" />
              <p className="text-xs text-status-red font-medium leading-snug">{result.message}</p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-[10px] text-text-muted hover:text-text-secondary transition-colors pl-5"
            >
              Try again
            </button>
          </div>
        )
      ) : (
        // Form
        <div className="space-y-3">

          {/* Safety notice */}
          <div className="rounded-lg px-3 py-2 bg-status-orange/5 border border-status-orange/20">
            <p className="text-[10px] text-text-muted leading-snug">
              DONNA will build a readiness review draft for{' '}
              <span className="text-text-secondary font-medium">{playerName}</span>.
              {' '}No level change occurs until you approve it in the Review Queue.
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-2">

            {/* Current level — editable hint */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1">
                Current level
                {currentTrackHint && (
                  <span className="normal-case tracking-normal font-normal text-text-muted/60 ml-1">
                    — inferred from track, confirm before submitting
                  </span>
                )}
              </label>
              <input
                type="text"
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
                placeholder="e.g. Orange 1"
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
              />
            </div>

            {/* Target next level — required */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1">
                Target next level
                <span className="text-status-red ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={nextLevel}
                onChange={e => setNextLevel(e.target.value)}
                placeholder="e.g. Orange 2"
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
              />
            </div>

            {/* Gate evidence — optional */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1">
                Gate evidence
                <span className="normal-case tracking-normal font-normal text-text-muted/60 ml-1">(optional)</span>
              </label>
              <textarea
                value={gateEvidence}
                onChange={e => setGateEvidence(e.target.value)}
                placeholder="Brief summary of evidence supporting readiness…"
                rows={2}
                className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Missing data hint */}
          {(!currentLevel.trim() || !nextLevel.trim()) && (
            <p className="text-[10px] text-text-muted">
              {!currentLevel.trim() && !nextLevel.trim()
                ? 'Enter current level and target level to enable drafting.'
                : !currentLevel.trim()
                  ? 'Current level is required.'
                  : 'Target next level is required.'}
            </p>
          )}

          {/* Submit / cancel */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={isPending || !currentLevel.trim() || !nextLevel.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime/10 border border-lime/30 text-[11px] text-lime font-medium hover:bg-lime/20 hover:border-lime/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending
                ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                : <Sparkles className="w-3 h-3 shrink-0" />
              }
              Draft with DONNA
            </button>
            <button
              onClick={handleReset}
              className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
