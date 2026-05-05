'use client'

// Sprint 247 — Voice Intake Review Panel V1
// Display card for proposed_actions rows with target_module = 'voice_intake'.
// Shows full voice intake draft: transcript, intents, destinations, entities,
// safety flags, what would change, what would not change.
// Decision controls approve/reject/clarify — no apply step in V1.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, ShieldCheck, AlertTriangle, CheckCircle, XCircle, HelpCircle, Zap, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { updateVoiceIntakeDraftDecisionAction } from './actions'
import type { DraftDecision } from './actions'
import { executeVoiceIntakeDraftAction } from './executeVoiceIntakeDraftAction'

export interface VoiceIntakeDraftPayload {
  draft_type: 'voice_intake_v1'
  role: string
  context: { page?: string; academy_id?: string }
  raw_transcript: string
  cleaned_summary?: string
  detected_intents: string[]
  confidence: 'high' | 'medium' | 'low'
  suggested_destinations: string[]
  recommended_primary_action?: string
  extracted_entities: Array<{ type: string; value: string }>
  affected_players: string[]
  affected_groups: string[]
  affected_sessions: string[]
  safety_flags: string[]
  what_would_change: string[]
  what_would_not_change: string[]
  requires_review: boolean
}

export interface EnrichedVoiceIntakeDraftItem {
  id: string
  status: string
  createdAt: string
  proposerName: string | null
  riskLevel: string | null
  payload: VoiceIntakeDraftPayload
}

const ROLE_LABELS: Record<string, string> = {
  academy_director: 'Director',
  head_coach: 'Head Coach',
  coach: 'Coach',
}

const INTENT_DISPLAY: Record<string, string> = {
  create_session_draft: 'Session Draft',
  create_group_draft: 'Group Draft',
  set_group_focus: 'Set Group Focus',
  create_player_review_request: 'Player Review Request',
  create_parent_safe_draft: 'Parent Safe Draft',
  summarize_curriculum_gaps: 'Curriculum Gap Summary',
  create_coach_briefing: 'Coach Briefing',
  record_director_note: 'Director Note',
  record_attendance_exception: 'Attendance Exception',
  flag_unrostered_attendee: 'Unrostered Attendee Flag',
  create_player_observation: 'Player Observation',
  create_gate_evidence_draft: 'Gate Evidence Draft',
  create_session_recap: 'Session Recap',
  create_gap_signal: 'Gap Signal',
  create_parent_safe_candidate: 'Parent Safe Candidate',
  alert_director: 'Director Alert',
  unknown: 'Unknown',
}

const SAFETY_DISPLAY: Record<string, { label: string; color: string }> = {
  parent_exposure_risk: { label: 'Parent exposure risk', color: 'text-status-orange border-status-orange/30 bg-status-orange/5' },
  auto_execution_requested: { label: 'Auto-execution blocked', color: 'text-status-red border-status-red/30 bg-status-red/5' },
  level_change_requested: { label: 'Level change flagged', color: 'text-status-orange border-status-orange/30 bg-status-orange/5' },
  parent_send_requested: { label: 'Parent send blocked', color: 'text-status-red border-status-red/30 bg-status-red/5' },
  roster_mutation_requested: { label: 'Roster mutation blocked', color: 'text-status-red border-status-red/30 bg-status-red/5' },
  billing_enrollment_risk: { label: 'Billing/enrollment risk', color: 'text-status-red border-status-red/30 bg-status-red/5' },
  cross_player_leak_risk: { label: 'Multiple players — review scope', color: 'text-status-orange border-status-orange/30 bg-status-orange/5' },
}

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'text-status-orange border-status-orange/30 bg-status-orange/5',
  approved: 'text-status-green border-status-green/30 bg-status-green/5',
  rejected: 'text-status-red border-status-red/30 bg-status-red/5',
  clarification_needed: 'text-status-orange border-status-orange/30 bg-status-orange/5',
}

function VoiceIntakeDecisionControls({ proposedActionId }: { proposedActionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [noteText, setNoteText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleDecision(decision: DraftDecision) {
    startTransition(async () => {
      const res = await updateVoiceIntakeDraftDecisionAction(
        proposedActionId,
        decision,
        noteText.trim() || undefined,
      )
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Decision recorded. Refreshing queue…
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        Approving records your review. No data changes in V1 — voice intake execution is a future step.
      </div>

      <div className="space-y-1">
        <label className="label-xs" htmlFor={`vi-note-${proposedActionId}`}>
          Decision note (optional)
        </label>
        <textarea
          id={`vi-note-${proposedActionId}`}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Add context for the next reviewer…"
          disabled={isPending}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-50"
        />
        {noteText.length > 800 && (
          <p className="text-[10px] text-text-muted text-right">{noteText.length}/1000</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDecision('approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-green/10 text-status-green border border-status-green/30 hover:bg-status-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Approve
        </button>
        <button
          onClick={() => handleDecision('clarification_needed')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-orange/10 text-status-orange border border-status-orange/30 hover:bg-status-orange/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Needs Clarification
        </button>
        <button
          onClick={() => handleDecision('rejected')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-red/10 text-status-red border border-status-red/30 hover:bg-status-red/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
      {isPending && (
        <p className="text-[11px] text-text-muted">Recording decision…</p>
      )}
    </div>
  )
}

export function VoiceIntakeDraftCard({ draft }: { draft: EnrichedVoiceIntakeDraftItem }) {
  const { payload } = draft
  const statusClass = STATUS_COLORS[draft.status] ?? 'text-text-muted border-border bg-surface-raised'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="label-xs">Voice Intake Draft</p>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusClass}`}>
              {draft.status.replace(/_/g, ' ')}
            </span>
            {draft.riskLevel && draft.riskLevel !== 'low' && (
              <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
                draft.riskLevel === 'high' ? 'border-status-red/30 text-status-red bg-status-red/5' :
                'border-status-orange/30 text-status-orange bg-status-orange/5'
              }`}>
                {draft.riskLevel} risk
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            {draft.proposerName && <span>by {draft.proposerName}</span>}
            <span>{new Date(draft.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-full border border-lime/30 bg-lime/5 text-[10px] text-lime font-medium">
            {ROLE_LABELS[payload.role] ?? payload.role}
          </span>
          {payload.context?.page && (
            <span className="text-[10px] text-text-muted">{payload.context.page}</span>
          )}
          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
            payload.confidence === 'high' ? 'border-status-green/30 text-status-green' :
            payload.confidence === 'medium' ? 'border-status-orange/30 text-status-orange' :
            'border-border text-text-muted'
          }`}>
            {payload.confidence} confidence
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        {/* Raw transcript */}
        <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Transcript</p>
          <p className="text-sm text-text-secondary leading-relaxed">{payload.raw_transcript}</p>
        </div>

        {/* Cleaned summary */}
        {payload.cleaned_summary && payload.cleaned_summary !== payload.raw_transcript && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Summary</p>
            <p className="text-xs text-text-secondary leading-relaxed">{payload.cleaned_summary}</p>
          </div>
        )}

        {/* Safety flags */}
        {payload.safety_flags.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Safety Flags</p>
            <div className="flex flex-wrap gap-2">
              {payload.safety_flags.map(flag => {
                const d = SAFETY_DISPLAY[flag]
                return d ? (
                  <span key={flag} className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium ${d.color}`}>
                    {d.label}
                  </span>
                ) : (
                  <span key={flag} className="px-2.5 py-1 rounded-lg border border-status-orange/30 text-status-orange text-[10px]">
                    {flag}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Detected intents */}
        {payload.detected_intents.length > 0 && payload.detected_intents[0] !== 'unknown' && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Detected Intents</p>
            <div className="flex flex-wrap gap-2">
              {payload.detected_intents.map(intent => (
                <span key={intent} className="px-2.5 py-1 rounded-lg bg-lime/5 border border-lime/20 text-[10px] text-lime">
                  {INTENT_DISPLAY[intent] ?? intent}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Extracted entities */}
        {payload.extracted_entities.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Extracted</p>
            <div className="flex flex-wrap gap-2">
              {payload.extracted_entities.map((ent, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-surface-raised border border-border text-xs text-text-secondary">
                  <span className="text-text-muted">{ent.type}:</span> {ent.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested destinations */}
        {payload.suggested_destinations.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Suggested Destinations</p>
            <div className="flex flex-wrap gap-2">
              {payload.suggested_destinations.map((dest, i) => (
                <span
                  key={dest}
                  className={`px-2 py-1 rounded-lg border text-[10px] ${i === 0 ? 'bg-lime/5 border-lime/20 text-lime' : 'border-border text-text-secondary'}`}
                >
                  {dest.replace(/_/g, ' ')}{i === 0 ? ' ★' : ''}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-text-muted mt-1">★ = recommended primary destination</p>
          </div>
        )}

        {/* Recommended action */}
        {payload.recommended_primary_action && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Recommended Action</p>
            <p className="text-xs text-text-secondary leading-relaxed">{payload.recommended_primary_action}</p>
          </div>
        )}

        {/* What would change */}
        {payload.what_would_change.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">What Would Change (if approved)</p>
            <ul className="space-y-0.5">
              {payload.what_would_change.map((item, i) => (
                <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                  <span className="text-lime shrink-0">→</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What would NOT change */}
        {payload.what_would_not_change.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Will Not Change Automatically</p>
            <ul className="space-y-0.5">
              {payload.what_would_not_change.slice(0, 4).map((item, i) => (
                <li key={i} className="text-[10px] text-text-muted flex gap-1.5">
                  <span className="text-status-red shrink-0">✕</span>{item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety note */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <ShieldCheck className="w-3 h-3 text-lime shrink-0" />
          Source: Voice Intake — no data changed without director approval
        </div>

        {/* Decision controls — only for pending */}
        {draft.status === 'pending_review' && (
          <VoiceIntakeDecisionControls proposedActionId={draft.id} />
        )}

        {/* Approved — show Execute controls */}
        {draft.status === 'approved' && (
          <VoiceIntakeExecuteControls proposedActionId={draft.id} />
        )}

      </CardContent>
    </Card>
  )
}

function VoiceIntakeExecuteControls({ proposedActionId }: { proposedActionId: string }) {
  const [result, setResult] = useState<{ ok: boolean; error: string | null; executedType: string | null } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleExecute() {
    setResult(null)
    startTransition(async () => {
      const res = await executeVoiceIntakeDraftAction(proposedActionId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Executed: {result.executedType?.replace(/_/g, ' ')} — internal record created.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Approved. Ready to execute — creates an internal record from this capture.
      </div>
      <button
        onClick={handleExecute}
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-lime text-base hover:bg-lime/90 transition-all disabled:opacity-50"
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Executing…</>
          : <><Zap className="w-4 h-4" /> Execute — Create Internal Record</>}
      </button>
      {result?.error && (
        <p className="text-[11px] text-status-red flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{result.error}
        </p>
      )}
    </div>
  )
}
