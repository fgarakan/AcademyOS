import { Users, Lock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

interface Props {
  playerFirstName: string | null
  currentLevelName: string | null
  currentFocus: string | null
}

export function PlayerParentSummaryBlock({
  playerFirstName,
  currentLevelName,
  currentFocus,
}: Props) {
  const name = playerFirstName ?? 'This player'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">Parent / Player Summary</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
            <Lock className="w-2.5 h-2.5" />
            Internal
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        <p className="text-[11px] text-text-muted leading-relaxed">
          A parent-safe summary will live here once drafted. It will be reviewed by the director before being shared with {name}'s family.
        </p>

        {/* Preview of what the summary will include */}
        <div className="space-y-2">
          {currentLevelName && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-raised border border-border">
              <p className="text-[11px] text-text-muted">Current level</p>
              <p className="text-[11px] text-text-secondary font-medium">{currentLevelName}</p>
            </div>
          )}
          {currentFocus && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
              <p className="text-[11px] text-text-muted shrink-0">Focus</p>
              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">{currentFocus}</p>
            </div>
          )}
          {!currentLevelName && !currentFocus && (
            <div className="px-3 py-3 rounded-lg border border-dashed border-border">
              <p className="text-[11px] text-text-muted leading-relaxed">
                No parent-safe summary has been drafted yet. Assign a level and add coach notes first.
              </p>
            </div>
          )}
        </div>

        {/* Coming-soon CTA */}
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border opacity-60 cursor-not-allowed"
          aria-disabled="true"
        >
          <Users className="w-4 h-4 text-text-muted shrink-0" />
          <div>
            <p className="text-xs font-medium text-text-muted">Draft Parent Update</p>
            <p className="text-[10px] text-text-muted mt-0.5">Coming soon</p>
          </div>
        </div>

        <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-3">
          Parent updates are director-reviewed before sharing. No information is sent automatically.
        </p>

      </CardContent>
    </Card>
  )
}
