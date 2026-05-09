import { Lock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

export interface FirstDevContextData {
  currentLevel: string | null
  startingPathway: string | null
  suggestedGroupType: string | null
  firstSkillPriority: string | null
  confidence: 'high' | 'medium' | 'low' | null
  groupName: string | null
  assessmentSummary: {
    ageBand: string | null
    ballColor: string | null
    skillObservations: string | null
    movementObservations: string | null
    competitiveReadiness: string | null
  } | null
  placedAt: string | null
}

interface Props {
  data: FirstDevContextData
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high:   'text-status-green',
  medium: 'text-status-orange',
  low:    'text-status-red',
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
      <p className="text-xs text-text-primary">{value ?? '—'}</p>
    </div>
  )
}

export function FirstDevelopmentContextCard({ data }: Props) {
  const placedDate = data.placedAt
    ? new Date(data.placedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  const confidenceColor = data.confidence ? (CONFIDENCE_COLORS[data.confidence] ?? 'text-text-muted') : 'text-text-muted'
  const hasAssessment =
    data.assessmentSummary &&
    (
      data.assessmentSummary.skillObservations ||
      data.assessmentSummary.movementObservations ||
      data.assessmentSummary.competitiveReadiness ||
      data.assessmentSummary.ageBand ||
      data.assessmentSummary.ballColor
    )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="label-xs">First Development Context</p>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
            <Lock className="w-2.5 h-2.5" /> Internal only
          </span>
        </div>
        {placedDate && (
          <p className="text-[10px] text-text-muted mt-0.5">
            From placement · {placedDate}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Safety note */}
        <p className="text-[10px] text-text-muted leading-snug border-b border-border pb-3">
          Internal director/coach context. Not shown to parents or players.
        </p>

        {/* Core placement fields */}
        <div className="grid grid-cols-2 gap-3">
          <Row label="Starting Pathway"  value={data.startingPathway} />
          <Row label="First Skill Priority" value={data.firstSkillPriority} />
          <Row label="Suggested Group Type" value={data.suggestedGroupType} />
          <Row label="Assigned Group"    value={data.groupName} />
        </div>

        {/* Confidence */}
        {data.confidence && (
          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Placement Confidence</p>
            <p className={`text-xs font-semibold capitalize ${confidenceColor}`}>
              {data.confidence}
            </p>
          </div>
        )}

        {/* Assessment evidence */}
        {hasAssessment && (
          <details className="group">
            <summary className="text-[10px] text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors">
              Assessment evidence ▸
            </summary>
            <div className="mt-2 space-y-2 pl-2 border-l border-border">
              {data.assessmentSummary!.ageBand && (
                <p className="text-[10px] text-text-secondary">
                  <span className="text-text-muted">Age band: </span>
                  {data.assessmentSummary!.ageBand}
                </p>
              )}
              {data.assessmentSummary!.ballColor && (
                <p className="text-[10px] text-text-secondary">
                  <span className="text-text-muted">Ball color: </span>
                  {data.assessmentSummary!.ballColor}
                </p>
              )}
              {data.assessmentSummary!.skillObservations && (
                <p className="text-[10px] text-text-secondary leading-snug">
                  <span className="text-text-muted">Skills: </span>
                  {data.assessmentSummary!.skillObservations}
                </p>
              )}
              {data.assessmentSummary!.movementObservations && (
                <p className="text-[10px] text-text-secondary leading-snug">
                  <span className="text-text-muted">Movement: </span>
                  {data.assessmentSummary!.movementObservations}
                </p>
              )}
              {data.assessmentSummary!.competitiveReadiness && (
                <p className="text-[10px] text-text-secondary leading-snug">
                  <span className="text-text-muted">Competitive readiness: </span>
                  {data.assessmentSummary!.competitiveReadiness}
                </p>
              )}
            </div>
          </details>
        )}

        {/* Curriculum level limitation */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-status-orange/5 border border-status-orange/20">
          <AlertCircle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-status-orange leading-snug">
            Curriculum level not assigned yet. Assign from the Skill Path tab to activate curriculum tracking.
          </p>
        </div>

        {/* Next step */}
        <p className="text-[10px] text-text-muted leading-snug border-t border-border pt-3">
          Next: assign curriculum level from Skill Path, then review first development priorities.
        </p>
      </CardContent>
    </Card>
  )
}
