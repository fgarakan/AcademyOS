// Sprint 916 — DONNA Director UX Integration V1
// Server component: fetches donna_entity_summaries for the academy and renders
// director-safe summary cards. No raw IDs, no summaryJson, no sensitive notes.
// Falls back gracefully (renders nothing) if no summaries exist.

import type { DB } from '@/lib/types/db'
import { getRelevantEntitySummaries } from '@/lib/donna/donnaEntitySummaries'
import type { EntitySummaryType } from '@/lib/donna/donnaEntitySummaries'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { Brain } from 'lucide-react'

interface Props {
  db: DB
  academyId: string
}

const ENTITY_LABEL: Record<string, string> = {
  player:           'Player',
  group:            'Group',
  curriculum_level: 'Curriculum Level',
  template:         'Template',
  session:          'Session',
  academy:          'Academy',
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high:    'bg-status-green/10 text-status-green border-status-green/20',
  medium:  'bg-lime/10 text-lime border-lime/20',
  low:     'bg-status-orange/10 text-status-orange border-status-orange/20',
  partial: 'bg-surface-raised text-text-muted border-border',
}

const VISIBLE_TYPES: EntitySummaryType[] = ['player', 'group', 'curriculum_level']

export async function DonnaEntitySummarySection({ db, academyId }: Props) {
  const result = await getRelevantEntitySummaries(db, {
    academyId,
    limit: 6,
  })

  if (!result.ok || !result.data || result.data.length === 0) {
    return null
  }

  // Filter to director-visible entity types only
  const summaries = result.data.filter(s =>
    (VISIBLE_TYPES as string[]).includes(s.entityType) &&
    s.visibilityScope !== 'system' &&
    s.summaryText
  )

  if (summaries.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <span className="label-xs flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-lime" />
          Entity Signals
        </span>
        <p className="text-[10px] text-text-muted mt-0.5">
          DONNA-derived summaries from academy data.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {summaries.map(s => (
            <div key={s.id} className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
                  {ENTITY_LABEL[s.entityType] ?? s.entityType}
                </span>
                {s.confidence && (
                  <span className={`text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full border ${CONFIDENCE_STYLE[s.confidence] ?? CONFIDENCE_STYLE.partial}`}>
                    {s.confidence}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary leading-snug">
                {s.summaryText}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-3 leading-snug">
          Summaries are derived from academy signals — verify before acting.
        </p>
      </CardContent>
    </Card>
  )
}
