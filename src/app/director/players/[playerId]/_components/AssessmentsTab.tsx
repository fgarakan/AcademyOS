// Sprint 1196-1210 — Assessments Tab (updated Sprint 1421-1450: routing engine)
// Template-driven. Resolves the correct ball-level template based on player stage and purpose.
// Falls back to Core Assessment Template when no ball-level template exists.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { ClipboardList, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react'
import { loadAssessmentFormConfigByName } from '@/lib/assessment/assessmentTemplateLoader'
import { resolveAssessmentTemplate } from '@/lib/assessment/assessmentTemplateResolver'
import type { PreviousAssessmentData, ScoresDetail } from '@/lib/assessment/assessmentTemplateTypes'
import { AssessmentPurposePicker } from './AssessmentPurposePicker'
import { LevelReadinessCard } from './LevelReadinessCard'
import { DevelopmentPrioritiesCard } from './DevelopmentPrioritiesCard'

interface AssessmentsTabProps {
  playerId:         string
  academyId:        string
  playerStage:      string | null
  playerStatus?:    string | null
  playerFirstName?: string | null
  currentLevelName?: string | null
  nextLevelName?:   string | null
}

interface AssessmentRow {
  id:                string
  assessed_date:     string
  type:              string
  is_baseline:       boolean
  technical_score:   number | null
  tactical_score:    number | null
  movement_score:    number | null
  competition_score: number | null
  behavioral_score:  number | null
  overall_score:     number | null
  strengths:         string[] | null
  notes:             string | null
  scores_detail:     unknown | null
}

interface AssessmentEventRow {
  id:                     string
  assessment_type:        string
  assessment_mode:        string
  status:                 string
  scheduled_for:          string | null
  completed_at:           string | null
  blueprint_recommendation: string | null
  assessment_id:          string | null
  created_at:             string
}

const SCORE_DOMAINS = [
  { key: 'technical_score',   label: 'Technical'   },
  { key: 'tactical_score',    label: 'Tactical'    },
  { key: 'movement_score',    label: 'Movement'    },
  { key: 'competition_score', label: 'Competition' },
  { key: 'behavioral_score',  label: 'Mental'      },
] as const

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[10px] text-text-muted">—</span>
  const pct = Math.min(100, (score / 10) * 100)
  const color = score >= 7.5 ? 'bg-status-green' : score >= 5 ? 'bg-lime' : 'bg-status-orange'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-text-secondary shrink-0 w-6 text-right">{score.toFixed(1)}</span>
    </div>
  )
}

function ScoreChangeIcon({ delta }: { delta: number | null }) {
  if (delta === null) return <Minus className="w-3 h-3 text-text-muted" />
  if (delta > 0.4) return <TrendingUp className="w-3 h-3 text-status-green" />
  if (delta < -0.4) return <TrendingDown className="w-3 h-3 text-status-red" />
  return <Minus className="w-3 h-3 text-text-muted" />
}

function AssessmentCard({ assessment, prevAssessment }: { assessment: AssessmentRow; prevAssessment?: AssessmentRow }) {
  const detail = assessment.scores_detail as any
  const label: string | null = detail?.assessment_label ?? null
  const view: string | null = detail?.assessment_view ?? null

  return (
    <Card>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-surface-raised rounded-t-xl">
        <div>
          <p className="text-xs font-semibold text-text-primary">
            {new Date(assessment.assessed_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-text-muted capitalize mt-0.5">
            {label ? label.replace(/_/g, ' ') : assessment.type.replace(/_/g, ' ')}
            {view && <span className="ml-1">· {view.replace(/_/g, ' ')}</span>}
            {assessment.is_baseline && ' · Baseline'}
          </p>
        </div>
        {assessment.overall_score !== null && (
          <div className="text-right">
            <p className="text-sm font-bold font-mono text-lime">{assessment.overall_score.toFixed(1)}</p>
            <p className="text-[9px] text-text-muted">overall</p>
          </div>
        )}
      </div>
      <CardContent className="py-4">
        <div className="space-y-2">
          {SCORE_DOMAINS.map(({ key, label: domLabel }) => {
            const score = assessment[key as keyof AssessmentRow] as number | null
            const prevScore = prevAssessment ? (prevAssessment[key as keyof AssessmentRow] as number | null) : null
            const delta = score !== null && prevScore !== null ? score - prevScore : null
            return (
              <div key={key} className="flex items-center gap-3">
                <p className="text-[10px] text-text-muted w-20 shrink-0">{domLabel}</p>
                <div className="flex-1 min-w-0"><ScoreBar score={score} /></div>
                {prevAssessment && <ScoreChangeIcon delta={delta} />}
              </div>
            )
          })}
        </div>

        {assessment.strengths && assessment.strengths.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="label-xs text-text-muted mb-1.5">Strengths</p>
            <div className="flex flex-wrap gap-1">
              {assessment.strengths.slice(0, 4).map((s, i) => (
                <span key={i} className="text-[10px] text-status-green bg-status-green/8 border border-status-green/20 rounded px-2 py-0.5">{s}</span>
              ))}
            </div>
          </div>
        )}

        {assessment.notes && (
          <p className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted leading-relaxed">
            {assessment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export async function AssessmentsTab({
  playerId,
  academyId,
  playerStage,
  playerStatus = null,
  playerFirstName = null,
  currentLevelName = null,
  nextLevelName = null,
}: AssessmentsTabProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="text-xs text-text-muted">Not authenticated.</p>

  const rawDb = supabase as any

  // ── Auth: get user role ──────────────────────────────────────────────────
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  const userRole: string = membership?.role ?? 'coach'

  // ── Fetch user display name for the form ─────────────────────────────────
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  // ── Assessment history (last 10) ──────────────────────────────────────────
  const { data: assessmentsData } = await supabase
    .from('assessments')
    .select([
      'id', 'assessed_date', 'type', 'is_baseline',
      'technical_score', 'tactical_score', 'movement_score', 'competition_score', 'behavioral_score',
      'overall_score', 'strengths', 'notes', 'scores_detail',
    ].join(', '))
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('assessed_date', { ascending: false })
    .limit(10)

  const assessments = (assessmentsData ?? []) as unknown as AssessmentRow[]

  // ── Most recent assessment for reassessment mode ──────────────────────────
  const previousAssessment: PreviousAssessmentData | null = assessments.length > 0
    ? {
        id:                assessments[0].id,
        assessed_date:     assessments[0].assessed_date,
        overall_score:     assessments[0].overall_score,
        technical_score:   assessments[0].technical_score,
        tactical_score:    assessments[0].tactical_score,
        movement_score:    assessments[0].movement_score,
        competition_score: assessments[0].competition_score,
        behavioral_score:  assessments[0].behavioral_score,
        scores_detail:     assessments[0].scores_detail as ScoresDetail | null,
      }
    : null

  // ── Assessment events (migration 079) ────────────────────────────────────
  let events: AssessmentEventRow[] = []
  try {
    const { data: eventsData, error } = await rawDb
      .from('assessment_events')
      .select('id, assessment_type, assessment_mode, status, scheduled_for, completed_at, blueprint_recommendation, assessment_id, created_at')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (!error?.message?.includes('does not exist') && !error?.code?.includes('42P01')) {
      events = eventsData ?? []
    }
  } catch { /* migration not applied */ }

  // ── Resolve which template to use based on player stage + purpose ────────
  const resolution = resolveAssessmentTemplate({
    playerStage,
    playerStatus,
    playerFirstName,
    existingAssessmentCount: assessments.length,
    requestedPurpose: null, // default — DONNA picks
  })

  let formConfig: (import('@/lib/assessment/assessmentTemplateTypes').AssessmentFormConfig & { fallbackUsed: boolean; fallbackReason: string | null }) | null = null
  try {
    formConfig = await loadAssessmentFormConfigByName(
      supabase,
      academyId,
      resolution.templateName,
      resolution.mode,
    )
  } catch {
    // Template tables not yet applied — graceful fallback
  }

  // ── Pending coach assessment drafts ──────────────────────────────────────
  const { data: pendingDrafts } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('target_module', 'assessment_studio_draft')
    .eq('target_object_id', playerId)
    .in('status', ['pending_review'])
    .order('created_at', { ascending: false })
    .limit(3)
  const draftCount = (pendingDrafts ?? []).length

  return (
    <div className="space-y-5" data-donna-focus-id="player-assessments-section">

      {/* Development Priorities — evidence-based priorities above the form */}
      <DevelopmentPrioritiesCard
        playerId={playerId}
        academyId={academyId}
        playerFirstName={playerFirstName}
        currentLevelName={currentLevelName}
      />

      {/* Level Readiness Card — evidence-based signal above the assessment form */}
      <LevelReadinessCard
        playerId={playerId}
        academyId={academyId}
        playerFirstName={playerFirstName}
        currentLevelName={currentLevelName}
        nextLevelName={nextLevelName}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-xs text-text-muted mb-0.5">Assessment Studio</p>
          <p className="text-xs text-text-secondary">
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} recorded
            {draftCount > 0 && <span className="ml-2 text-status-orange">· {draftCount} coach draft{draftCount > 1 ? 's' : ''} pending</span>}
          </p>
        </div>
      </div>

      {/* Purpose Picker + Assessment Studio Form */}
      {formConfig ? (
        <AssessmentPurposePicker
          playerId={playerId}
          academyId={academyId}
          playerStage={playerStage}
          playerStatus={playerStatus}
          playerFirstName={playerFirstName}
          existingAssessmentCount={assessments.length}
          userRole={userRole}
          resolvedPurpose={resolution.purpose}
          resolvedTemplateName={resolution.templateName}
          donnaExplanation={resolution.donnaExplanation}
          confidence={resolution.confidence}
          fallbackUsed={formConfig.fallbackUsed}
          fallbackReason={formConfig.fallbackReason}
          formConfig={formConfig}
          previousAssessment={previousAssessment}
        />
      ) : (
        <div className="px-4 py-6 rounded-xl bg-surface border border-border text-center space-y-2">
          <ClipboardList className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-xs font-semibold text-text-primary">Assessment template not yet loaded</p>
          <p className="text-[11px] text-text-muted">
            Apply migrations 081–082 to enable the Assessment Studio.
          </p>
        </div>
      )}

      {/* Pending events */}
      {events.filter(e => ['draft', 'scheduled', 'in_progress'].includes(e.status)).length > 0 && (
        <div>
          <p className="label-xs text-text-muted mb-2">Scheduled</p>
          <div className="space-y-2">
            {events.filter(e => ['draft', 'scheduled', 'in_progress'].includes(e.status)).map(event => (
              <div key={event.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
                <div>
                  <p className="text-xs font-semibold text-text-primary capitalize">
                    {event.assessment_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-text-muted capitalize">
                    {event.assessment_mode} · {event.scheduled_for
                      ? `Scheduled ${new Date(event.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'Not yet scheduled'}
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide text-status-orange bg-status-orange/8 border border-status-orange/20 rounded px-1.5 py-0.5">
                  {event.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment history */}
      {assessments.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border px-6 py-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">No assessments yet</p>
            <p className="text-xs text-text-muted leading-relaxed max-w-xs">
              Use the form above to run the first assessment.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="label-xs text-text-muted">Assessment History</p>
          {assessments.map((assessment, index) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              prevAssessment={assessments[index + 1]}
            />
          ))}
        </div>
      )}

      {/* Completed event blueprint recommendations */}
      {events.filter(e => e.status === 'completed' && e.blueprint_recommendation).length > 0 && (
        <div>
          <p className="label-xs text-text-muted mb-2">Blueprint Recommendations</p>
          <div className="space-y-2">
            {events.filter(e => e.status === 'completed' && e.blueprint_recommendation).map(event => (
              <div key={event.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
                <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-text-primary capitalize">
                    {event.blueprint_recommendation?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    From {event.assessment_type.replace(/_/g, ' ')} ·{' '}
                    {event.completed_at ? new Date(event.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
