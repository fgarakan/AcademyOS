import Link from 'next/link'
import { ClipboardList, Users, BookOpen, Calendar, ChevronRight } from 'lucide-react'
import type { SituationType } from '@/lib/donna/operations/operatingPartnerOutputContract'

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuickAction {
  id:      string
  label:   string
  sub:     string
  href:    string
  icon:    React.ReactNode
  count?:  number
  primary: boolean
}

interface Props {
  situationType:         SituationType
  workQueuePendingCount: number
  alertCount:            number
}

// ── Situation → actions ────────────────────────────────────────────────────────

function resolveQuickActions(
  situationType:         SituationType,
  workQueuePendingCount: number,
): QuickAction[] {
  const approvals: QuickAction = {
    id:      'approvals',
    label:   'Open Approvals',
    sub:     workQueuePendingCount > 0 ? `${workQueuePendingCount} pending` : 'Review queue',
    href:    '/director/review',
    icon:    <ClipboardList size={18} className="shrink-0" />,
    count:   workQueuePendingCount > 0 ? workQueuePendingCount : undefined,
    primary: true,
  }

  const players: QuickAction = {
    id:      'players',
    label:   'View Players',
    sub:     'Directory + profiles',
    href:    '/director/players',
    icon:    <Users size={18} className="shrink-0" />,
    primary: false,
  }

  const curriculum: QuickAction = {
    id:      'curriculum',
    label:   'Open Curriculum',
    sub:     'Levels + health',
    href:    '/director/curriculum',
    icon:    <BookOpen size={18} className="shrink-0" />,
    primary: false,
  }

  const sessions: QuickAction = {
    id:      'sessions',
    label:   'View Sessions',
    sub:     'Schedule + recaps',
    href:    '/director/sessions',
    icon:    <Calendar size={18} className="shrink-0" />,
    primary: false,
  }

  const ACTION_MAP: Record<SituationType, QuickAction[]> = {
    player_progression_bottleneck: [players,     approvals, sessions],
    coach_execution_gap:           [sessions,    approvals, players],
    curriculum_gap:                [curriculum,  approvals, players],
    parent_retention_risk:         [approvals,   players,   sessions],
    business_capacity_issue:       [approvals,   players,   curriculum],
    philosophy_drift:              [curriculum,  approvals, players],
    assessment_debt:               [players,     approvals, sessions],
    communication_gap:             [approvals,   players,   sessions],
    opportunity_to_double_down:    [players,     curriculum, approvals],
    unclear_cause_requires_review: [approvals,   players,   sessions],
  }

  return ACTION_MAP[situationType] ?? [approvals, players, sessions]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaQuickActions({ situationType, workQueuePendingCount, alertCount: _alertCount }: Props) {
  const actions = resolveQuickActions(situationType, workQueuePendingCount)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map(action => (
        <Link
          key={action.id}
          href={action.href}
          className={`
            group flex items-center gap-3 rounded-xl border p-4 transition-all
            ${action.primary
              ? 'bg-lime/5 border-lime/30 hover:bg-lime/10 hover:border-lime/60'
              : 'bg-surface-raised border-border hover:border-border hover:bg-surface-raised/80'
            }
          `}
        >
          <span className={action.primary ? 'text-lime' : 'text-text-secondary'}>
            {action.icon}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-base font-semibold leading-none ${action.primary ? 'text-lime' : 'text-text-primary'}`}>
                {action.label}
              </p>
              {action.count !== undefined && action.count > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-lime text-base-black text-xs font-bold">
                  {action.count}
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-0.5 leading-none">
              {action.sub}
            </p>
          </div>

          <ChevronRight
            size={16}
            className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
              action.primary ? 'text-lime' : 'text-text-secondary'
            }`}
          />
        </Link>
      ))}
    </div>
  )
}
