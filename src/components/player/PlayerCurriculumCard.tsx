import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'

interface Props {
  skillTrackLevelName: string | null
  skillTrackStage: string | null
  competitionTrackLevelName: string | null
  fitnessPathPhase: string | null
  nextLevelName: string | null
  hasCurriculumState: boolean
}

function TrackRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-[10px] text-text-muted shrink-0">{label}</span>
      {value ? (
        <span className="text-[11px] text-text-secondary text-right font-medium leading-snug">{value}</span>
      ) : (
        <span className="text-[10px] text-text-muted italic">Not assigned</span>
      )}
    </div>
  )
}

export function PlayerCurriculumCard({
  skillTrackLevelName,
  skillTrackStage,
  competitionTrackLevelName,
  fitnessPathPhase,
  nextLevelName,
  hasCurriculumState,
}: Props) {
  const formattedStage = skillTrackStage
    ? skillTrackStage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null

  const formattedFitnessPhase = fitnessPathPhase
    ? fitnessPathPhase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="label-xs">Curriculum</p>
          <Link
            href="/director/curriculum"
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-lime transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Explore
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasCurriculumState ? (
          <div className="py-2">
            <p className="text-[11px] text-text-muted">No curriculum level assigned yet.</p>
            <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
              Use the Skill Path tab to assign a starting level.
            </p>
          </div>
        ) : (
          <div>
            <TrackRow label="Skill Track" value={skillTrackLevelName} />
            <TrackRow label="Competition Track" value={competitionTrackLevelName} />
            <TrackRow
              label="Fitness Phase"
              value={formattedFitnessPhase}
            />
            {nextLevelName && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                <span className="text-[10px] text-text-muted shrink-0">Next target</span>
                <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-[10px] text-lime font-medium">{nextLevelName}</span>
              </div>
            )}
            {formattedStage && (
              <p className="text-[10px] text-text-muted mt-2">
                Stage: <span className="text-text-secondary">{formattedStage}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
