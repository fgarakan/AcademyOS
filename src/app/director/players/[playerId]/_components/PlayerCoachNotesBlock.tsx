import { MessageSquare, FileText } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface NoteEntry {
  content: string
  created_at: string
  observation_type?: string | null
}

interface Props {
  latestNote: NoteEntry | null
  observationCount: number
}

export function PlayerCoachNotesBlock({ latestNote, observationCount }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">Coach Notes & Evidence</p>
          </div>
          {observationCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-lime bg-lime/10 border border-lime/20 px-2 py-0.5 rounded">
              {observationCount}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Coach notes fuel this player's profile. Each observation builds the development record and supports level advancement.
        </p>

        {latestNote ? (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Latest Note</p>
            <div className="px-3 py-3 rounded-lg bg-surface-raised border border-border">
              <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
                {latestNote.content}
              </p>
              <p className="text-[10px] text-text-muted mt-2">
                {formatDate(latestNote.created_at)}
                {latestNote.observation_type && (
                  <span className="ml-2 capitalize">&middot; {latestNote.observation_type.replace(/_/g, ' ')}</span>
                )}
              </p>
            </div>
            {observationCount > 1 && (
              <p className="text-[10px] text-text-muted px-1">
                +{observationCount - 1} more observation{observationCount - 1 > 1 ? 's' : ''} — open Notes tab to see all.
              </p>
            )}
          </div>
        ) : (
          <div className="px-3 py-3 rounded-lg border border-dashed border-border">
            <div className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-muted leading-relaxed">
                No coach notes yet. Capture one observation to start building this player's development record.
              </p>
            </div>
          </div>
        )}

        {/* CTA guidance — points to Notes tab, no route needed */}
        <div className="px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Capture Player Note</p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Open the <span className="text-text-secondary font-medium">Notes</span> tab or use the{' '}
            <span className="text-text-secondary font-medium">Academy Assistant</span> → Capture a note to add a coach observation for this player.
          </p>
        </div>

      </CardContent>
    </Card>
  )
}
