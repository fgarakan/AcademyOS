import { Trophy, Minus } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

export interface CompetitionPathPreviewData {
  match_format: string | null
  scoring_system: string | null
  opponent_pool: string | null
  tournament_cadence: string | null
  win_loss_target: string | null
  transition_signal: string | null
}

interface Props {
  currentLevelName: string | null
  data: CompetitionPathPreviewData | null
  hasCurriculumState: boolean
}

interface FieldRowProps {
  label: string
  value: string | null
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
      <div className="min-w-[120px] shrink-0">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
      </div>
      {value ? (
        <p className="text-[11px] text-text-primary leading-relaxed">{value}</p>
      ) : (
        <div className="flex items-center gap-1 text-text-muted">
          <Minus className="w-3 h-3" />
          <p className="text-[11px]">Not specified</p>
        </div>
      )}
    </div>
  )
}

export function PlayerCompetitionPathCurriculumPreview({
  currentLevelName,
  data,
  hasCurriculumState,
}: Props) {
  if (!hasCurriculumState) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#11d9df]" />
            <p className="label-xs">Competition Path</p>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#11d9df] px-2 py-0.5 rounded border border-[#11d9df]/20 bg-[#11d9df]/5">
            Curriculum preview
          </span>
        </div>
        {currentLevelName && (
          <p className="text-sm text-text-secondary mt-1">{currentLevelName}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-2">

        {data ? (
          <>
            <FieldRow label="Match Format"       value={data.match_format} />
            <FieldRow label="Scoring System"     value={data.scoring_system} />
            <FieldRow label="Opponent Pool"      value={data.opponent_pool} />
            <FieldRow label="Tournament Cadence" value={data.tournament_cadence} />
            <FieldRow label="Win/Loss Target"    value={data.win_loss_target} />
            <FieldRow label="Transition Signal"  value={data.transition_signal} />
          </>
        ) : (
          <div className="px-3 py-3 rounded-lg border border-dashed border-border">
            <p className="text-[11px] text-text-muted">
              No competition track data found for this curriculum level. Contact your curriculum administrator.
            </p>
          </div>
        )}

        <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-3">
          Curriculum-derived preview. Competition results, UTR, and match history are shown in the sections below.
        </p>

      </CardContent>
    </Card>
  )
}
