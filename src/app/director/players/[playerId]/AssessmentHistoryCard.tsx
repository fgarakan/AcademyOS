import { ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

type AssessmentType = 'intake' | 'quarterly' | 'reassessment' | 'promotion' | 'ad_hoc'

interface AssessmentHistoryRow {
  id: string
  assessed_date: string
  type: AssessmentType
  overall_score: number | null
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  notes: string | null
  assessed_by_name: string | null
  is_baseline: boolean
  promotion_ready: boolean
}

interface Props {
  assessments: AssessmentHistoryRow[]
}

const TYPE_LABELS: Record<AssessmentType, string> = {
  intake: 'Intake',
  quarterly: 'Quarterly',
  reassessment: 'Reassessment',
  promotion: 'Promotion',
  ad_hoc: 'Ad-hoc',
}

const TYPE_COLORS: Record<AssessmentType, string> = {
  intake:       'bg-status-blue/10 text-status-blue border-status-blue/20',
  quarterly:    'bg-lime/10 text-lime border-lime/20',
  reassessment: 'bg-status-orange/10 text-status-orange border-status-orange/20',
  promotion:    'bg-status-green/10 text-status-green border-status-green/20',
  ad_hoc:       'bg-surface border-border text-text-secondary',
}

const DOMAIN_KEYS: {
  key: keyof Pick<AssessmentHistoryRow, 'technical_score' | 'tactical_score' | 'movement_score' | 'competition_score' | 'behavioral_score'>
  short: string
}[] = [
  { key: 'technical_score',   short: 'Tech' },
  { key: 'tactical_score',    short: 'Tact' },
  { key: 'movement_score',    short: 'Mvmt' },
  { key: 'competition_score', short: 'Comp' },
  { key: 'behavioral_score',  short: 'Bhvr' },
]

function scoreColor(score: number | null): string {
  if (score === null) return 'text-text-muted'
  if (score <= 25) return 'text-status-red'
  if (score <= 50) return 'text-status-orange'
  if (score <= 75) return 'text-lime'
  return 'text-status-green'
}

function scoreBarColor(score: number): string {
  if (score <= 25) return 'bg-status-red'
  if (score <= 50) return 'bg-status-orange'
  if (score <= 75) return 'bg-lime'
  return 'bg-status-green'
}

export function AssessmentHistoryCard({ assessments }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="label-xs">Assessment History</p>
          </div>
          <span className="text-[10px] font-mono text-text-muted shrink-0">{assessments.length} records</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {assessments.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <p className="text-[11px] text-text-muted">No assessments recorded yet.</p>
            <p className="text-[10px] text-text-muted">Use the Quick Rating form above or run a formal assessment.</p>
          </div>
        ) : (
          assessments.map(a => {
            const hasDomainScores = DOMAIN_KEYS.some(d => a[d.key] !== null)
            return (
              <div key={a.id} className="rounded-lg bg-surface-raised border border-border p-3 space-y-2.5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TYPE_COLORS[a.type]}`}>
                      {TYPE_LABELS[a.type]}
                    </span>
                    <p className="text-xs text-text-secondary">{formatDate(a.assessed_date)}</p>
                    {a.is_baseline && (
                      <span className="text-[10px] text-status-blue font-medium">baseline</span>
                    )}
                    {a.promotion_ready && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border bg-status-green/10 text-status-green border-status-green/20 font-semibold">
                        promotion-ready
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.overall_score !== null && (
                      <span className={`text-base font-mono font-bold ${scoreColor(a.overall_score)}`}>
                        {a.overall_score}
                      </span>
                    )}
                    {a.assessed_by_name && (
                      <p className="text-[10px] text-text-muted">{a.assessed_by_name}</p>
                    )}
                  </div>
                </div>

                {/* Domain score bars */}
                {hasDomainScores && (
                  <div className="space-y-1">
                    {DOMAIN_KEYS.map(d => {
                      const score = a[d.key]
                      if (score === null) return null
                      return (
                        <div key={d.key} className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted w-8 shrink-0">{d.short}</span>
                          <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreBarColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono w-6 text-right shrink-0 ${scoreColor(score)}`}>
                            {score}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {a.notes && (
                  <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{a.notes}</p>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
