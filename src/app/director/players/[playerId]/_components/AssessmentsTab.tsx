// Sprint 1113-1120 — Assessments Tab
// Server Component — shows assessment history and start new assessment CTA.
// Reads from assessment_events (migration 079) with fallback to assessments table.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { ClipboardList, Plus, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react'

interface AssessmentsTabProps {
  playerId: string
  academyId: string
}

interface AssessmentRow {
  id: string
  assessed_date: string
  type: string
  is_baseline: boolean
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  overall_score: number | null
  strengths: string[] | null
  weaknesses: string[] | null
  notes: string | null
}

interface AssessmentEventRow {
  id: string
  assessment_type: string
  assessment_mode: string
  status: string
  scheduled_for: string | null
  completed_at: string | null
  blueprint_recommendation: string | null
  assessment_id: string | null
  created_at: string
}

const SCORE_DOMAINS = [
  { key: 'technical_score',   label: 'Technical' },
  { key: 'tactical_score',    label: 'Tactical' },
  { key: 'movement_score',    label: 'Movement' },
  { key: 'competition_score', label: 'Competition' },
  { key: 'behavioral_score',  label: 'Mental' },
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
  if (delta > 0.5) return <TrendingUp className="w-3 h-3 text-status-green" />
  if (delta < -0.5) return <TrendingDown className="w-3 h-3 text-status-red" />
  return <Minus className="w-3 h-3 text-text-muted" />
}

function AssessmentCard({ assessment, prevAssessment }: { assessment: AssessmentRow; prevAssessment?: AssessmentRow }) {
  return (
    <Card>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-surface-raised rounded-t-xl">
        <div>
          <p className="text-xs font-semibold text-text-primary">
            {new Date(assessment.assessed_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-text-muted capitalize mt-0.5">
            {assessment.type.replace(/_/g, ' ')} {assessment.is_baseline && '• Baseline'}
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
          {SCORE_DOMAINS.map(({ key, label }) => {
            const score = assessment[key as keyof AssessmentRow] as number | null
            const prevScore = prevAssessment ? (prevAssessment[key as keyof AssessmentRow] as number | null) : null
            const delta = score !== null && prevScore !== null ? score - prevScore : null
            return (
              <div key={key} className="flex items-center gap-3">
                <p className="text-[10px] text-text-muted w-20 shrink-0">{label}</p>
                <div className="flex-1 min-w-0">
                  <ScoreBar score={score} />
                </div>
                {prevAssessment && <ScoreChangeIcon delta={delta} />}
              </div>
            )
          })}
        </div>

        {/* Strengths */}
        {assessment.strengths && assessment.strengths.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="label-xs text-text-muted mb-1.5">Strengths</p>
            <div className="flex flex-wrap gap-1">
              {assessment.strengths.slice(0, 4).map((s, i) => (
                <span key={i} className="text-[10px] text-status-green bg-status-green/8 border border-status-green/20 rounded px-2 py-0.5">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {assessment.notes && (
          <p className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted leading-relaxed">
            {assessment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export async function AssessmentsTab({ playerId, academyId }: AssessmentsTabProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="text-xs text-text-muted">Not authenticated.</p>

  const rawDb = supabase as any

  // Fetch assessments (existing table — always available)
  const { data: assessmentsData } = await supabase
    .from('assessments')
    .select([
      'id', 'assessed_date', 'type', 'is_baseline',
      'technical_score', 'tactical_score', 'movement_score', 'competition_score', 'behavioral_score',
      'overall_score', 'strengths', 'weaknesses', 'notes',
    ].join(', '))
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('assessed_date', { ascending: false })

  const assessments = (assessmentsData ?? []) as unknown as AssessmentRow[]

  // Fetch assessment events (migration 079 — graceful fallback)
  let events: AssessmentEventRow[] = []
  let hasEventsTable = false
  try {
    const { data: eventsData, error } = await rawDb
      .from('assessment_events')
      .select('id, assessment_type, assessment_mode, status, scheduled_for, completed_at, blueprint_recommendation, assessment_id, created_at')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error?.message?.includes('does not exist') && !error?.code?.includes('42P01')) {
      events = eventsData ?? []
      hasEventsTable = true
    }
  } catch { /* migration not applied */ }

  return (
    <div className="space-y-5">

      {/* Header + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label-xs text-text-muted mb-0.5">Assessment History</p>
          <p className="text-xs text-text-secondary">
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {hasEventsTable && (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-raised border border-border text-[11px] font-medium text-text-muted">
            <Plus className="w-3 h-3" />
            Start Reassessment
          </div>
        )}
      </div>

      {/* Pending/scheduled events */}
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
                    {event.assessment_mode} · {event.scheduled_for ? `Scheduled ${new Date(event.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Not yet scheduled'}
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
              Assessment scores are recorded during onboarding placement and can be updated at any reassessment event.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment, index) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              prevAssessment={assessments[index + 1]}
            />
          ))}
        </div>
      )}

      {/* Completed event summary */}
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
