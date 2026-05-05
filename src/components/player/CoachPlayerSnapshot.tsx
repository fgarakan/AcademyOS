import { Eye, Zap, Target, ArrowRight, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface Props {
  currentFocus: string | null
  doingWell: string[]
  workingOn: string[]
  topPriority: string | null
  recentNote: string | null
  recentNoteDate: string | null
  updatedAt: string | null
}

export function CoachPlayerSnapshot({
  currentFocus,
  doingWell,
  workingOn,
  topPriority,
  recentNote,
  recentNoteDate,
  updatedAt,
}: Props) {
  const hasContent = currentFocus || doingWell.length > 0 || workingOn.length > 0 || topPriority

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-lime" />
            <p className="label-xs">Coach Snapshot</p>
          </div>
          {updatedAt && (
            <p className="text-[10px] text-text-muted">Updated {formatDate(updatedAt)}</p>
          )}
        </div>
        <p className="text-[10px] text-text-muted mt-0.5">
          What to focus on with this player today.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasContent ? (
          <p className="text-xs text-text-muted italic">
            Add a development summary or priorities to populate this snapshot.
          </p>
        ) : (
          <div className="space-y-3">
            {currentFocus && (
              <div className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Current Focus</p>
                  <p className="text-sm text-text-primary">{currentFocus}</p>
                </div>
              </div>
            )}

            {doingWell.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 mt-0.5 text-status-green text-xs font-bold">✓</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Doing Well</p>
                  <p className="text-sm text-text-secondary">{doingWell[0]}</p>
                </div>
              </div>
            )}

            {workingOn.length > 0 && (
              <div className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Working On</p>
                  <p className="text-sm text-text-secondary">{workingOn[0]}</p>
                </div>
              </div>
            )}

            {topPriority && (
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Next Priority</p>
                  <p className="text-sm text-text-secondary">{topPriority}</p>
                </div>
              </div>
            )}

            {recentNote && (
              <div className="flex items-start gap-2 pt-2 border-t border-border">
                <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
                    Recent Note{recentNoteDate ? ` · ${formatDate(recentNoteDate)}` : ''}
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {recentNote.length > 120 ? recentNote.slice(0, 120).trimEnd() + '…' : recentNote}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
