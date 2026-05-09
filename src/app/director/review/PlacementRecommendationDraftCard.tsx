'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, ShieldCheck, Trophy, X, Edit2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import {
  approveRecommendationDraftAction,
  rejectRecommendationDraftAction,
  overrideRecommendationDraftAction,
} from './actions'
import type { RecommendationOverrideFields } from './actions'

export interface PlacementRecommendationDraftPayload {
  draft_type: 'placement_recommendation_draft_v1'
  source: string
  source_proposed_action_id: string
  attendee_name: string
  session_id: string | null
  current_level: string
  starting_pathway: string
  suggested_group_type: string
  first_skill_priority: string
  confidence: 'low' | 'medium' | 'high'
  director_override_notes: string
  director_overridden?: boolean
  assessment_summary: {
    age_band: string | null
    ball_color: string | null
    skill_observations: string
    movement_observations: string
    competitive_readiness: string
    recommended_next_step: string
  }
  no_player_created: boolean
  no_roster_change: boolean
  no_billing: boolean
  no_parent_communication: boolean
}

export interface EnrichedRecommendationDraftItem {
  id: string
  status: string
  createdAt: string
  sessionName: string | null
  sessionDate: string | null
  payload: PlacementRecommendationDraftPayload
}

interface Props {
  item: EnrichedRecommendationDraftItem
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   'text-status-green bg-status-green/10 border-status-green/25',
  medium: 'text-status-orange bg-status-orange/10 border-status-orange/25',
  low:    'text-status-red bg-status-red/10 border-status-red/25',
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence — consider filling in more assessment fields before approving',
}

const SAFETY_BADGES = [
  'No player record',
  'No roster entry',
  'No billing',
  'No parent comms',
] as const

type ActiveAction = 'approve' | 'reject' | 'override'

export function PlacementRecommendationDraftCard({ item }: Props) {
  const { payload } = item
  const router = useRouter()

  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; error: string | null; action: ActiveAction } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Override form state
  const [overCurrentLevel, setOverCurrentLevel] = useState(payload.current_level)
  const [overStartingPathway, setOverStartingPathway] = useState(payload.starting_pathway)
  const [overGroupType, setOverGroupType] = useState(payload.suggested_group_type)
  const [overSkillPriority, setOverSkillPriority] = useState(payload.first_skill_priority)
  const [overNotes, setOverNotes] = useState(payload.director_override_notes ?? '')

  const confidenceStyle = CONFIDENCE_STYLES[payload.confidence] ?? CONFIDENCE_STYLES['low']

  function handleApprove() {
    setResult(null)
    setActiveAction('approve')
    startTransition(async () => {
      const res = await approveRecommendationDraftAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'approve' })
      if (res.ok) router.refresh()
    })
  }

  function handleReject() {
    setResult(null)
    setActiveAction('reject')
    startTransition(async () => {
      const res = await rejectRecommendationDraftAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'reject' })
      if (res.ok) router.refresh()
    })
  }

  function handleOverride() {
    setResult(null)
    setActiveAction('override')
    const fields: RecommendationOverrideFields = {
      current_level: overCurrentLevel,
      starting_pathway: overStartingPathway,
      suggested_group_type: overGroupType,
      first_skill_priority: overSkillPriority,
      director_override_notes: overNotes,
    }
    startTransition(async () => {
      const res = await overrideRecommendationDraftAction(item.id, fields)
      setResult({ ok: res.ok, error: res.error, action: 'override' })
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    const successMessages: Record<ActiveAction, string> = {
      approve: 'Recommendation approved. No player record has been created yet — Sprint 168 adds the player creation step.',
      reject: 'Recommendation rejected. No player record was created.',
      override: 'Recommendation overridden and approved. No player record has been created yet.',
    }
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-xs text-status-green">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{successMessages[result.action]}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Placement Recommendation</p>
            </div>
            <p className="text-sm font-semibold text-text-primary">{payload.attendee_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-orange/10 text-status-orange border-status-orange/30">
              Awaiting Approval
            </span>
            <p className="text-[10px] text-text-muted">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Session context */}
        {(item.sessionName || item.sessionDate) && (
          <div className="p-2.5 rounded-lg bg-surface-raised border border-border space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Source Session</p>
            {item.sessionName && (
              <p className="text-xs text-text-secondary">{item.sessionName}</p>
            )}
            {item.sessionDate && (
              <p className="text-[10px] text-text-muted">
                {new Date(item.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Recommendation fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-raised rounded-lg border border-border p-2.5 space-y-0.5">
            <p className="text-[9px] uppercase tracking-widest text-text-muted">Current Level</p>
            <p className="text-xs font-semibold text-text-primary">{payload.current_level}</p>
          </div>
          <div className="bg-surface-raised rounded-lg border border-border p-2.5 space-y-0.5">
            <p className="text-[9px] uppercase tracking-widest text-text-muted">Starting Pathway</p>
            <p className="text-xs font-semibold text-text-primary">{payload.starting_pathway}</p>
          </div>
          <div className="bg-surface-raised rounded-lg border border-border p-2.5 space-y-0.5">
            <p className="text-[9px] uppercase tracking-widest text-text-muted">Group Type</p>
            <p className="text-xs font-semibold text-text-primary">{payload.suggested_group_type}</p>
          </div>
          <div className="bg-surface-raised rounded-lg border border-border p-2.5 space-y-0.5">
            <p className="text-[9px] uppercase tracking-widest text-text-muted">First Priority</p>
            <p className="text-xs font-semibold text-text-primary">{payload.first_skill_priority}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium ${confidenceStyle}`}>
          <span>{CONFIDENCE_LABEL[payload.confidence]}</span>
        </div>

        {/* Assessment summary */}
        {payload.assessment_summary && (
          <details className="group">
            <summary className="text-[10px] text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors">
              Assessment details ▸
            </summary>
            <div className="mt-2 space-y-1.5 pl-2 border-l border-border">
              {payload.assessment_summary.age_band && (
                <p className="text-[10px] text-text-secondary"><span className="text-text-muted">Age band:</span> {payload.assessment_summary.age_band}</p>
              )}
              {payload.assessment_summary.ball_color && (
                <p className="text-[10px] text-text-secondary"><span className="text-text-muted">Ball color:</span> {payload.assessment_summary.ball_color}</p>
              )}
              {payload.assessment_summary.skill_observations && (
                <p className="text-[10px] text-text-secondary"><span className="text-text-muted">Skills:</span> {payload.assessment_summary.skill_observations}</p>
              )}
              {payload.assessment_summary.movement_observations && (
                <p className="text-[10px] text-text-secondary"><span className="text-text-muted">Movement:</span> {payload.assessment_summary.movement_observations}</p>
              )}
              {payload.assessment_summary.competitive_readiness && (
                <p className="text-[10px] text-text-secondary"><span className="text-text-muted">Competitive:</span> {payload.assessment_summary.competitive_readiness}</p>
              )}
            </div>
          </details>
        )}

        {/* Override form (toggled) */}
        {showOverrideForm && (
          <div className="space-y-3 p-3 rounded-xl bg-surface-raised border border-border">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Director Override</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-text-muted">Current Level</label>
                <input
                  type="text"
                  value={overCurrentLevel}
                  onChange={e => setOverCurrentLevel(e.target.value)}
                  className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-text-muted">Starting Pathway</label>
                <input
                  type="text"
                  value={overStartingPathway}
                  onChange={e => setOverStartingPathway(e.target.value)}
                  className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-text-muted">Group Type</label>
                <input
                  type="text"
                  value={overGroupType}
                  onChange={e => setOverGroupType(e.target.value)}
                  className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-text-muted">First Priority</label>
                <input
                  type="text"
                  value={overSkillPriority}
                  onChange={e => setOverSkillPriority(e.target.value)}
                  className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-text-muted">Override Notes</label>
              <textarea
                value={overNotes}
                onChange={e => setOverNotes(e.target.value)}
                rows={2}
                placeholder="Reason for override…"
                className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none"
              />
            </div>
            <button
              type="button"
              onClick={handleOverride}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime/10 border border-lime/30 text-lime font-semibold text-xs hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeAction === 'override' && isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCircle className="w-3.5 h-3.5" />
              }
              {activeAction === 'override' && isPending ? 'Applying override…' : 'Override and Approve'}
            </button>
          </div>
        )}

        {/* Safety badges */}
        <div className="flex flex-wrap gap-1.5">
          {SAFETY_BADGES.map(badge => (
            <div key={badge} className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-surface-raised border-border">
              <ShieldCheck className="w-2.5 h-2.5 text-status-green shrink-0" />
              <span className="text-[9px] text-text-muted">{badge}</span>
            </div>
          ))}
        </div>

        {/* ── Decision controls ── */}
        <div className="pt-2 border-t border-border space-y-2">
          {/* Approve */}
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime/10 border border-lime/30 text-lime font-semibold text-xs hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeAction === 'approve' && isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle className="w-3.5 h-3.5" />
            }
            {activeAction === 'approve' && isPending ? 'Approving…' : 'Approve Recommendation'}
          </button>

          <div className="flex gap-2">
            {/* Override */}
            <button
              type="button"
              onClick={() => setShowOverrideForm(v => !v)}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:border-status-blue/40 hover:text-status-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit2 className="w-3 h-3" />
              {showOverrideForm ? 'Hide Override' : 'Override'}
            </button>
            {/* Reject */}
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:border-status-red/40 hover:text-status-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeAction === 'reject' && isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <X className="w-3 h-3" />
              }
              {activeAction === 'reject' && isPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>

          <p className="text-[10px] text-text-muted leading-snug px-0.5">
            Approving does not create a player record. Player creation is the next explicit step after approval.
          </p>
        </div>

        {result?.error && (
          <p className="text-xs text-status-red">{result.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
