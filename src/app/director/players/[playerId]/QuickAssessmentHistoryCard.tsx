import { ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

interface AssessmentRecord {
  id: string
  assessed_date: string
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  notes: string | null
  assessed_by_name: string | null
}

interface Props {
  assessments: AssessmentRecord[]
}

const DOMAIN_KEYS: { key: keyof Omit<AssessmentRecord, 'id' | 'assessed_date' | 'notes' | 'assessed_by_name'>; label: string }[] = [
  { key: 'technical_score', label: 'Technical' },
  { key: 'tactical_score', label: 'Tactical' },
  { key: 'movement_score', label: 'Movement' },
  { key: 'competition_score', label: 'Competition' },
  { key: 'behavioral_score', label: 'Behavioral' },
]

function scoreLabel(score: number | null): string | null {
  if (score === null) return null
  if (score <= 25) return 'Needs support'
  if (score <= 50) return 'Developing'
  if (score <= 75) return 'Solid'
  return 'Strong'
}

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

export function QuickAssessmentHistoryCard({ assessments }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-sm">Quick Rating History</p>
            <p className="text-text-muted text-xs">Last {assessments.length > 0 ? Math.min(assessments.length, 3) : 0} ad-hoc ratings</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {assessments.length === 0 ? (
          <p className="text-xs text-text-muted py-2">No quick ratings yet. Use the form above to add one.</p>
        ) : (
          assessments.slice(0, 3).map(a => (
            <div key={a.id} className="rounded-lg bg-surface-raised border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-text-primary">{formatDate(a.assessed_date)}</p>
                {a.assessed_by_name && (
                  <p className="text-[10px] text-text-muted">{a.assessed_by_name}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {DOMAIN_KEYS.map(d => {
                  const score = a[d.key] as number | null
                  const label = scoreLabel(score)
                  if (!label) return null
                  return (
                    <div key={d.key} className="flex items-center gap-1">
                      <span className="text-[10px] text-text-muted">{d.label}:</span>
                      <span className={`text-[10px] font-semibold ${scoreColor(score)}`}>{label}</span>
                    </div>
                  )
                })}
              </div>
              {a.notes && (
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{a.notes}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
