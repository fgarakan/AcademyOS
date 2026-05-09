'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ClipboardList, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { saveAssessmentDraftAction, generatePlacementRecommendationDraftAction } from './actions'
import type { AssessmentDraftFields, PlayerIdentity } from './actions'

export interface PlacementAssessmentDraftPayload {
  draft_type: 'placement_assessment_draft_v1'
  source: string
  source_proposed_action_id: string
  attendee_name: string
  session_id: string | null
  player_identity?: {
    first_name: string
    last_name: string
    date_of_birth: string
    gender: string | null
  }
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
const GENDER_OPTIONS = [
  { value: '', label: '— not specified —' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const

function guessNameParts(attendeeName: string): { first: string; last: string } {
  const trimmed = attendeeName.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) return { first: trimmed, last: '' }
  return { first: trimmed.slice(0, spaceIdx), last: trimmed.slice(spaceIdx + 1) }
}

export function PlacementAssessmentDraftCard({ item }: Props) {
  const { payload } = item
  const router = useRouter()

  // Pre-populate identity from payload or guess from attendee_name
  const savedIdentity = payload.player_identity
  const nameFallback = guessNameParts(payload.attendee_name ?? '')

  const [firstName, setFirstName] = useState(savedIdentity?.first_name ?? nameFallback.first)
  const [lastName, setLastName] = useState(savedIdentity?.last_name ?? nameFallback.last)
  const [dateOfBirth, setDateOfBirth] = useState(savedIdentity?.date_of_birth ?? '')
  const [gender, setGender] = useState(savedIdentity?.gender ?? '')

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

  function buildIdentity(): PlayerIdentity {
    return {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dateOfBirth.trim(),
      gender: gender || null,
    }
  }

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
      player_identity: buildIdentity(),
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

        {/* ── Player Identity ── */}
        <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-3">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Player Identity</p>
            <p className="text-[10px] text-status-orange leading-snug">
              Required before generating a recommendation. First name, last name, and date of birth must be saved here because <span className="font-semibold">players.date_of_birth is NOT NULL</span> — player creation will fail without them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-text-muted">
                First Name <span className="text-status-red">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-text-muted">
                Last Name <span className="text-status-red">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-text-muted">
                Date of Birth <span className="text-status-red">*</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-text-muted">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full text-xs bg-base border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-lime/50"
              >
                {GENDER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
            Save identity fields first, then generate. Recommendation generation requires first name, last name, and date of birth. No player profile, billing, or parent communication is created. Director must approve before any official record is created.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
