import { BookOpen, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui'

interface Props {
  currentLevelName: string | null
  nextLevelName: string | null
  hasCurriculumState: boolean
  currentStage: string | null
}

function stageLabel(stage: string | null): string {
  if (!stage) return ''
  const map: Record<string, string> = {
    red_development:    'Red Ball',
    orange_development: 'Orange Ball',
    green_development:  'Green Ball',
    yellow_development: 'Yellow Ball',
    high_performance:   'High Performance',
  }
  return map[stage] ?? stage.replace(/_/g, ' ')
}

export function PlayerCurriculumConnectionBlock({
  currentLevelName,
  nextLevelName,
  hasCurriculumState,
  currentStage,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-text-muted" />
          <p className="label-xs">Curriculum Connection</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        <p className="text-[11px] text-text-muted leading-relaxed">
          This player's level and priorities should connect back to the academy curriculum spine.
        </p>

        {hasCurriculumState ? (
          <>
            {/* Current level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Current Level</p>
                  <p className="text-sm font-medium text-text-primary">{currentLevelName ?? '—'}</p>
                  {currentStage && (
                    <p className="text-[10px] text-text-muted mt-0.5">{stageLabel(currentStage)}</p>
                  )}
                </div>
                <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
              </div>

              {nextLevelName ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Next Level</p>
                    <p className="text-xs text-lime font-medium">{nextLevelName}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-lime shrink-0" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
                  <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <p className="text-[11px] text-text-muted">Next level not yet determined.</p>
                </div>
              )}
            </div>

            {/* Requirements status */}
            <p className="text-[11px] text-text-muted leading-relaxed">
              Gate criteria and requirement tracking are visible on the Skill Path tab. Confirm gate evidence and requirement status before evaluating advancement.
            </p>
          </>
        ) : (
          <div className="px-3 py-3 rounded-lg border border-dashed border-border">
            <p className="text-[11px] text-text-muted leading-relaxed">
              Requirement tracking will appear here once this player is connected to the curriculum spine.
              Use the Skill Path tab to assign a level.
            </p>
          </div>
        )}

        {/* Link to curriculum */}
        <Link
          href="/director/curriculum"
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface hover:border-lime/25 hover:bg-lime/5 transition-all text-text-secondary hover:text-text-primary group"
        >
          <span className="text-xs">View Curriculum</span>
          <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0" />
        </Link>

      </CardContent>
    </Card>
  )
}
