import { cn } from '@/lib/utils'
import { ProgressBar } from '@/components/ui'
import type { Tables } from '@/lib/supabase/database.types'

type DomainRow = Tables<'v_player_curriculum_detail'>

const DOMAIN_LABELS: Record<string, string> = {
  preparation:          'Preparation',
  downswing:            'Downswing',
  contact:              'Contact',
  finish:               'Finish',
  transition:           'Transition',
  movement:             'Movement',
  decision_making:      'Decision Making',
  competition_behavior: 'Competition Behavior',
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not started', className: 'bg-surface-raised text-text-muted border-border' },
  in_progress: { label: 'In progress', className: 'bg-status-blue/15 text-status-blue border-status-blue/30' },
  complete:    { label: 'Complete',    className: 'bg-lime/15 text-lime border-lime/30' },
  regressed:   { label: 'Regressed',  className: 'bg-status-red/15 text-status-red border-status-red/30' },
}

const PROGRESS_VARIANT: Record<string, 'lime' | 'red' | 'muted'> = {
  complete:  'lime',
  regressed: 'red',
}

interface SkillDomainCardProps {
  row: DomainRow
}

export function SkillDomainCard({ row }: SkillDomainCardProps) {
  const status = row.status ?? 'not_started'
  const positiveCount = row.positive_outcome_count ?? 0
  const threshold = row.mastery_outcome_threshold ?? 0
  const domainLabel = row.domain ? (DOMAIN_LABELS[row.domain] ?? row.domain) : '—'
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.not_started
  const progressVariant = PROGRESS_VARIANT[status] ?? 'muted'

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 hover:border-border-strong transition-colors duration-150">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-text-primary leading-snug">{domainLabel}</h3>
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0',
          badge.className
        )}>
          {badge.label}
        </span>
      </div>

      {threshold > 0 && (
        <ProgressBar
          value={positiveCount}
          max={threshold}
          showValue
          variant={progressVariant}
          size="sm"
        />
      )}

      {row.progression_description && (
        <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2">
          {row.progression_description}
        </p>
      )}

      {status === 'complete' && row.success_criteria && row.success_criteria.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-lime/70 font-medium">Criteria met</p>
          <ul className="space-y-0.5">
            {row.success_criteria.slice(0, 2).map((c, i) => (
              <li key={i} className="text-[11px] text-lime/60 flex gap-1.5 leading-relaxed">
                <span className="shrink-0">·</span>{c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'regressed' && row.failure_patterns && row.failure_patterns.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-status-red/70 font-medium">Patterns</p>
          <ul className="space-y-0.5">
            {row.failure_patterns.slice(0, 2).map((p, i) => (
              <li key={i} className="text-[11px] text-status-red/70 flex gap-1.5 leading-relaxed">
                <span className="shrink-0">·</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
