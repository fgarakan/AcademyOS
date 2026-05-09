'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ClipboardList, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { saveAssessmentDraftAction, generatePlacementRecommendationDraftAction } from './actions'
import type { AssessmentDraftFields } from './actions'

export interface PlacementAssessmentDraftPayload {
  draft_type: 'placement_assessment_draft_v1'
  source: string
  source_proposed_action_id: string
  attendee_name: string
  session_id: string | null
  age_band: string | null
  ball_color: string | null
  skill_observations: string
  movement_observations: string
  competitive_readiness: string
  recommended_next_step: string
  no_player_created: boolean
  no_roster_change: boolean
  no_billing: boolean
  no_parent_communication: boolean
}

export interface EnrichedAssessmentDraftItem {
  id: string
  status: string
  createdAt: string
  sessionName: string | null
  sessionDate: string | null
  payload: PlacementAssessmentDraftPayload
}

interface Props {
  item: EnrichedAssessmentDraftItem
}

const AGE_BANDS = ['6–8', '9–10', '11–12', '13–14', '15–16', '17–18', '18+'] as const
const BALL_COLORS = ['Red', 'Orange', 'Green', 'Yellow'] as const

export function PlacementAssessmentDraftCard({ item }: Props) {
  const { payload } = item
  const router = useRouter()

  const [ageBand, setAgeBand] = useState(payload.age_band ?? '')
  const [ballColor, setBallColor] = useState(payload.ball_color ?? '')
  const [skillObs, setSkillObs] = useState(payload.skill_observations ?? '')
  const [movementObs, setMovementObs] = useState(payload.movement_observations ?? '')
  const [competitiveReadiness, setCompetitiveReadiness] = useState(payload.competitive_readiness ?? '')
  const [recommendedNext, setRecommendedNext] = useState(payload.recommended_next_step ?? '')

  type ActiveAction = 'save' | 'generate'
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [saveResult, setSaveResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [generateResult, setGenerateResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaveResult(null)
    setActiveAction('save')
    const fields: AssessmentDraftFields = {
      age_band: ageBand || null,
      ball_color: ballColor || null,
      skill_observations: skillObs,
      movement_observations: movementObs,
      competitive_readiness: competitiveReadiness,
      recommended_next_step: recommendedNext,
    }
    startTransition(async () => {
      const res = await saveAssessmentDraftAction(item.id, fields)
      setSaveResult({ ok: res.ok, error: res.error })
      setActiveAction(null)
    })
  }

  function handleGenerate() {
    setGenerateResult(null)
    setActiveAction('generate')
    startTransition(async () => {
      const res = await generatePlacementRecommendationDraftAction(item.id)
      setGenerateResult({ ok: res.ok, error: res.error })
      if (res.ok) router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-status-blue shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Placement Assessment</p>
            </div>
            <p className="text-sm font-semibold text-text-primary">{payload.attendee_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-blue/10 text-status-blue border-status-blue/30">
              In Assessment
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

        {/* Assessment fields */}
        <div className="space-y-3">
          {/* Age band + Ball color — row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">Age Band</label>
              <select
                value={ageBand}
                onChange={e => setAgeBand(e.target.value)}
                className="w-full text-xs bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
              >
                <option value="">— select —</option>
                {AGE_BANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-text-muted">Ball Color</label>
              <select
                value={ballColor}
                onChange={e => setBallColor(e.target.value)}
                className="w-full text-xs bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
              >
                <option value="">— select —</option>
                {BALL_COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill observations */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted">Skill Observations</label>
            <textarea
              value={skillObs}
              onChange={e => setSkillObs(e.target.value)}
              rows={2}
              placeholder="What technical skills did you observe?"
              className="w-full text-xs bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none"
            />
          </div>

          {/* Movement observations */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted">Movement Observations</label>
            <textarea
              value={movementObs}
              onChange={e => setMovementObs(e.target.value)}
              rows={2}
              placeholder="Movement quality, athleticism, coordination?"
              className="w-full text-xs bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none"
            />
          </div>

          {/* Competitive readiness */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted">Competitive Readiness</label>
            <textarea
              value={competitiveReadiness}
              onChange={e => setCompetitiveReadiness(e.target.value)}
              rows={2}
              placeholder="Competition experience, coachability, mental readiness?"
              className="w-full text-xs bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none"
            />
          </div>

          {/* Recommended next step */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-text-muted">Recommended Next Step</label>
            <textarea
              value={recommendedNext}
              onChange={e => setRecommendedNext(e.target.value)}
              rows={2}
              placeholder="What should happen after this assessment?"
              className="w-full text-xs bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-border space-y-3">
          {/* Save draft */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:border-lime/40 hover:text-lime transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeAction === 'save' && isPending
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <CheckCircle className="w-3 h-3" />
            }
            {activeAction === 'save' && isPending ? 'Saving…' : 'Save Assessment Draft'}
          </button>
          {saveResult?.ok && (
            <p className="text-[10px] text-status-green px-1">Assessment draft saved.</p>
          )}
          {saveResult?.error && (
            <p className="text-xs text-status-red">{saveResult.error}</p>
          )}

          {/* Generate recommendation */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime/10 border border-lime/30 text-lime font-semibold text-xs hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeAction === 'generate' && isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />
            }
            {activeAction === 'generate' && isPending ? 'Generating…' : 'Generate Placement Recommendation'}
          </button>
          {generateResult?.error && (
            <p className="text-xs text-status-red">{generateResult.error}</p>
          )}
          <p className="text-[10px] text-text-muted leading-snug px-0.5">
            Derives a placement recommendation from the assessment fields above. No player profile, billing, or parent communication is created. Director must approve the recommendation before any official record is created.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
