import { Trophy, Calendar, Target, Info } from 'lucide-react'

interface CompetitionTrack {
  level_id: string
  competition_format?: string | null
  recommended_frequency?: string | null
  typical_opponents?: string | null
  ranking_system?: string | null
  coaching_notes?: string | null
}

interface Props {
  track: CompetitionTrack | null
  levelName: string
}

export function CompetitionLayerPanel({ track, levelName }: Props) {
  if (!track) {
    return (
      <div className="rounded-2xl border border-border border-dashed p-6 text-center space-y-2">
        <Trophy className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] text-text-secondary">No competition guidance for {levelName}.</p>
        <p className="text-[11px] text-text-muted">Competition context helps coaches prepare players for match environments.</p>
      </div>
    )
  }

  const fields = [
    { icon: Trophy,    label: 'Format',       value: track.competition_format },
    { icon: Calendar,  label: 'Frequency',    value: track.recommended_frequency },
    { icon: Target,    label: 'Opponents',    value: track.typical_opponents },
    { icon: Target,    label: 'Rankings',     value: track.ranking_system },
  ].filter(f => f.value)

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Trophy className="w-4 h-4 text-status-orange shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">Competition context — {levelName}</p>
      </div>

      <div className="divide-y divide-border">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3 px-4 py-3">
            <Icon className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">{label}</p>
              <p className="text-[12px] text-text-primary">{value}</p>
            </div>
          </div>
        ))}

        {track.coaching_notes && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Coaching notes</p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{track.coaching_notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
