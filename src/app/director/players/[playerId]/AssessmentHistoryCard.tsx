import { ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

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
  intake: 'bg-status-blue/10 text-status-blue',
  quarterly: 'bg-lime/10 text-lime',
  reassessment: 'bg-status-orange/10 text-status-orange',
  promotion: 'bg-status-green/10 text-status-green',
  ad_hoc: 'bg-surface-raised text-text-secondary',
}

const DOMAIN_KEYS: { key: keyof Pick<AssessmentHistoryRow, 'technical_score' | 'tactical_score' | 'movement_score' | 'competition_score' | 'behavioral_score'>; short: string }[] = [
  { key: 'technical_score', short: 'Tech' },
  { key: 'tactical_score', short: 'Tact' },
  { key: 'movement_score', short: 'Mvmt' },
  { key: 'competition_score', short: 'Comp' },
  { key: 'behavioral_score', short: 'Bhvr' },
]

function scoreColor(score: number | null): string {
  if (score === null) return 'text-text-muted'
  if (score <= 25) return 'text-status-red'
  if (score <= 50) return 'text-status-orange'
  if (score <= 75) return 'text-lime'
  return 'text-status-green'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AssessmentHistoryCard({ assessments }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">Assessment History</p>
            <p className="text-text-muted text-xs">All formal + ad-hoc ratings</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {assessments.length === 0 ? (
          <p className="text-xs text-text-muted py-2">No assessments recorded yet.</p>
        ) : (
          assessments.map(a => {
            const hasDomainScores = DOMAIN_KEYS.some(d => a[d.key] !== null)
            return (
              <div key={a.id} className="rounded-lg bg-surface-raised border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[a.type]}`}>
                      {TYPE_LABELS[a.type]}
                    </span>
                    <p className="text-xs font-semibold text-text-primary">{formatDate(a.assessed_date)}</p>
                    {a.is_baseline && (
                      <span className="text-[10px] text-status-blue">baseline</span>
                    )}
                    {a.promotion_ready && (
                      <span className="text-[10px] text-status-green">promotion-ready</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.overall_score !== null && (
                      <span className={`text-xs font-mono font-semibold ${scoreColor(a.overall_score)}`}>
                        {a.overall_score}
                      </span>
                    )}
                    {a.assessed_by_name && (
                      <p className="text-[10px] text-text-muted">{a.assessed_by_name}</p>
                    )}
                  </div>
                </div>
                {hasDomainScores && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {DOMAIN_KEYS.map(d => {
                      const score = a[d.key]
                      if (score === null) return null
                      return (
                        <div key={d.key} className="flex items-center gap-1">
                          <span className="text-[10px] text-text-muted">{d.short}:</span>
                          <span className={`text-[10px] font-mono font-semibold ${scoreColor(score)}`}>{score}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {a.notes && (
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{a.notes}</p>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
