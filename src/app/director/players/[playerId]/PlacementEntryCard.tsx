import { ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

export interface PlacementEntryData {
  placementRecommendationId: string
  groupName: string | null
  activatedAt: string | null
  playerStatus: string | null
  confidenceScore: number | null
}

interface Props {
  data: PlacementEntryData
}

export function PlacementEntryCard({ data }: Props) {
  const activatedDate = data.activatedAt
    ? new Date(data.activatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="label-xs">Placement Entry</p>
          <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-surface-raised border-border text-text-muted">
            Internal only
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Source</p>
            <p className="text-xs text-text-primary">Placed via Academy OS intake pipeline</p>
          </div>

          {data.groupName && (
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">Assigned Group</p>
              <p className="text-xs font-semibold text-lime">{data.groupName}</p>
            </div>
          )}

          {activatedDate && (
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">Placement Date</p>
              <p className="text-xs text-text-primary">{activatedDate}</p>
            </div>
          )}

          {data.playerStatus && (
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">Player Status</p>
              <p className="text-xs text-text-primary capitalize">
                {data.playerStatus.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Placement Confidence</p>
            <p className="text-xs text-text-secondary">
              {data.confidenceScore != null ? `${Math.round(data.confidenceScore * 100)}%` : '—'}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-text-muted mb-0.5">Placement Record ID</p>
            <p className="font-mono text-[9px] text-text-muted break-all leading-relaxed">
              {data.placementRecommendationId}
            </p>
          </div>
        </div>

        {/* Confirmed guardrails */}
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-text-muted">Confirmed at placement</p>
          {[
            'No parent/player portal access created',
            'No billing or enrollment created',
            'No parent communication sent',
            'Activated via finalize_player_placement()',
          ].map(label => (
            <div key={label} className="flex items-center gap-1.5">
              <ShieldCheck className="w-2.5 h-2.5 text-status-green shrink-0" />
              <span className="text-[9px] text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Known limitation */}
        <p className="text-[9px] text-text-muted leading-snug border-t border-border pt-2">
          Curriculum level is not set at placement. Assign a curriculum level from the Skill Path tab.
        </p>
      </CardContent>
    </Card>
  )
}
