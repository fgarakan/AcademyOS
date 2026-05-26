import Link from 'next/link'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { Target } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  technical_skill:       'Technical Skill',
  tactical_skill:        'Tactical Skill',
  physical_fitness:      'Physical Fitness',
  competition_exposure:  'Competition Exposure',
  behavioral:            'Behavioral',
  load_management:       'Load Management',
  reassessment:          'Reassessment',
  promotion_readiness:   'Promotion Readiness',
}

const LEVEL_COLORS: Record<string, string> = {
  high:   'text-status-red',
  medium: 'text-status-orange',
  low:    'text-text-muted',
}

export interface PlayerPriorityRow {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  priority_level: string
  priority_rank: number
  urgency: string
  generated_at: string
  updated_at: string
  // Sprint 844: optional named approver resolved from audit_logs by page.tsx.
  // Undefined/null → falls back to "director" in the display.
  approved_by_name?: string | null
}

interface Props {
  priorities: PlayerPriorityRow[]
}

export function PlayerActivePriorities({ priorities }: Props) {
  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Active Priorities</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Priorities are shown for visibility only. Observations and evidence summaries do not automatically
          change priorities yet.
        </p>

        {priorities.length === 0 ? (
          <EmptyState
            icon={<Target className="w-5 h-5" />}
            title="No active priorities set"
            description="No active priorities have been set for this player yet. Future sprints will allow director-approved priorities to be created from evidence."
          />
        ) : (
          <div className="space-y-3">
            {priorities.map((p) => (
              <div
                key={p.id}
                className="bg-surface-raised border border-border rounded p-4 space-y-2"
              >
                {/* Title + level */}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-text-primary font-medium leading-snug">{p.title}</p>
                  <span
                    className={`text-[11px] uppercase tracking-widest shrink-0 ${LEVEL_COLORS[p.priority_level] ?? 'text-text-muted'}`}
                  >
                    {p.priority_level}
                  </span>
                </div>

                {/* Category badge */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] bg-surface border border-border text-text-secondary px-2 py-0.5 rounded">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </span>
                  {p.urgency && p.urgency !== 'normal' && (
                    <span className="text-[11px] bg-surface border border-border text-status-orange px-2 py-0.5 rounded">
                      {p.urgency} urgency
                    </span>
                  )}
                  <span className="text-[11px] bg-surface border border-border text-text-muted px-2 py-0.5 rounded capitalize">
                    {p.status}
                  </span>
                </div>

                {/* Description */}
                {p.description && (
                  <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
                )}

                {/* Attribution — Sprint 843/844
                    approved_by_name resolved from audit_logs by page.tsx; falls back to "director"
                    if no audit entry found (e.g. legacy or manually-created priorities).
                    generated_at = DB INSERT default = timestamp the priority was applied via apply action. */}
                <p className="text-[11px] text-text-muted">
                  Approved by {p.approved_by_name ?? 'director'} · Applied {formatDate(p.generated_at)}
                </p>
                {p.updated_at !== p.generated_at && (
                  <p className="text-[11px] text-text-muted">Updated {formatDate(p.updated_at)}</p>
                )}

                {/* Sprint 851: Review queue link — player_priorities has no proposed_action_id column
                    (not stored at insert time in actions.ts, not in database.types.ts schema).
                    Fallback: link to the Player Updates tab of the review queue where the originating
                    priority_recommendation proposed_action can be found by the director.
                    Read-only display — no data writes, no auto-navigation. Director-only path. */}
                <Link
                  href="/director/review?tab=player-updates"
                  className="inline-block text-[11px] text-lime/70 hover:text-lime transition-colors mt-0.5"
                >
                  View in review queue →
                </Link>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
