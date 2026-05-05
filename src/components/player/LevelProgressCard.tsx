import { ArrowRight, CheckCircle2, Clock, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface Props {
  currentLevelName: string | null
  currentStage: string | null
  nextLevelName: string | null
  advancementEligible: boolean | null
  hasCurriculumState: boolean
  requiresDirectorApproval: boolean | null
}

export function LevelProgressCard({
  currentLevelName,
  currentStage,
  nextLevelName,
  advancementEligible,
  hasCurriculumState,
  requiresDirectorApproval,
}: Props) {
  if (!hasCurriculumState) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Level Progress</p>
          <p className="text-xs text-text-muted">
            Level requirements will appear as curriculum requirements are connected.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Level Progress</p>

        {/* Current → Next level */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Current</p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {currentLevelName ?? '—'}
            </p>
            {currentStage && (
              <p className="text-[10px] text-text-muted capitalize">
                {currentStage.replace(/_/g, ' ')}
              </p>
            )}
          </div>

          {nextLevelName && (
            <>
              <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Next</p>
                <p className="text-sm font-semibold text-text-secondary truncate">{nextLevelName}</p>
              </div>
            </>
          )}
        </div>

        {/* Advancement status */}
        {advancementEligible === true ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-status-green/5 border border-status-green/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
            <p className="text-xs text-status-green">Meets advancement criteria</p>
          </div>
        ) : advancementEligible === false ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-raised border border-border">
            <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-xs text-text-muted">Not yet eligible for advancement</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-raised border border-border">
            <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-xs text-text-muted">Run evaluation to check eligibility</p>
          </div>
        )}

        {/* Director approval required */}
        {requiresDirectorApproval && (
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-text-muted shrink-0" />
            <p className="text-[10px] text-text-muted">Requires director approval to advance</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
