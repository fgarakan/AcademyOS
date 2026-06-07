import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface DecisionGroup {
  type: string
  typeLabel: string
  count: number
  donnaSummary: string
  riskLevel: 'low' | 'medium' | 'high'
  oldestAgeDays?: number | null
  href: string
  primaryActionLabel: string
}

interface Props {
  wrapUpsCount: number
  assessmentsCount: number
  placementReviewsCount: number
  lessonRequestsCount: number
  totalCount: number
  oldestPendingAgeDays: number | null
}

const RISK_CHIP: Record<string, string> = {
  high:   'bg-status-red/10 border-status-red/20 text-status-red',
  medium: 'bg-status-orange/10 border-status-orange/20 text-status-orange',
  low:    'bg-surface-raised border-border text-text-muted',
}

const TYPE_BADGE: Record<string, string> = {
  'wrap-up':   'bg-status-blue/10 border-status-blue/20 text-status-blue',
  'assessment':'bg-lime/10 border-lime/20 text-lime',
  'placement': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  'request':   'bg-surface-raised border-border text-text-muted',
}

function DecisionRow({ group }: { group: DecisionGroup }) {
  const badgeClass = TYPE_BADGE[group.type] ?? TYPE_BADGE['request']
  const riskClass  = RISK_CHIP[group.riskLevel] ?? RISK_CHIP['low']

  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
            {group.typeLabel}
          </span>
          <span className="font-mono font-bold text-[14px] text-text-primary">{group.count}</span>
          {group.oldestAgeDays !== null && group.oldestAgeDays !== undefined && group.oldestAgeDays > 2 && (
            <span className="text-[10px] text-status-orange">
              oldest {group.oldestAgeDays}d ago
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          <span className="text-text-muted font-medium">DONNA: </span>
          {group.donnaSummary}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${riskClass}`}>
            {group.riskLevel === 'high' ? 'High risk' : group.riskLevel === 'medium' ? 'Medium risk' : 'Low risk'}
          </span>
        </div>
      </div>
      <Link
        href={group.href}
        className="shrink-0 btn-lime text-[11px] px-3 py-1.5 flex items-center gap-1 mt-0.5"
      >
        {group.primaryActionLabel}
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

export function DirectorDecisionsQueue({
  wrapUpsCount,
  assessmentsCount,
  placementReviewsCount,
  lessonRequestsCount,
  totalCount,
  oldestPendingAgeDays,
}: Props) {
  const groups: DecisionGroup[] = []

  if (wrapUpsCount > 0) {
    groups.push({
      type:              'wrap-up',
      typeLabel:         'Coach Wrap-ups',
      count:             wrapUpsCount,
      donnaSummary:      `${wrapUpsCount} session recap${wrapUpsCount !== 1 ? 's' : ''} awaiting your review. Approving these closes the loop on player progress notes for the week.`,
      riskLevel:         oldestPendingAgeDays !== null && oldestPendingAgeDays > 5 ? 'medium' : 'low',
      oldestAgeDays:     oldestPendingAgeDays,
      href:              '/director/review?tab=wrap-ups',
      primaryActionLabel:'Review',
    })
  }

  if (assessmentsCount > 0) {
    groups.push({
      type:              'assessment',
      typeLabel:         'Assessments',
      count:             assessmentsCount,
      donnaSummary:      `${assessmentsCount} placement assessment${assessmentsCount !== 1 ? 's' : ''} ready for director sign-off. Assessment data is complete — your decision activates the placement.`,
      riskLevel:         'low',
      href:              '/director/review?tab=assessments',
      primaryActionLabel:'Review',
    })
  }

  if (placementReviewsCount > 0) {
    groups.push({
      type:              'placement',
      typeLabel:         'Placements',
      count:             placementReviewsCount,
      donnaSummary:      `${placementReviewsCount} curriculum placement${placementReviewsCount !== 1 ? 's' : ''} pending your approval. Players cannot join groups until placement is confirmed.`,
      riskLevel:         'medium',
      href:              '/director/review',
      primaryActionLabel:'Place',
    })
  }

  if (lessonRequestsCount > 0) {
    groups.push({
      type:              'request',
      typeLabel:         'Lesson Requests',
      count:             lessonRequestsCount,
      donnaSummary:      `${lessonRequestsCount} private lesson request${lessonRequestsCount !== 1 ? 's' : ''} from parents awaiting routing. These need review before scheduling.`,
      riskLevel:         'low',
      href:              '/director/review',
      primaryActionLabel:'Review',
    })
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="label-xs">Director Decisions</p>
        {totalCount > 0 && (
          <span className="font-mono text-[11px] font-bold text-status-orange bg-status-orange/10 border border-status-orange/30 px-2 py-0.5 rounded-full leading-none">
            {totalCount} waiting
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-surface">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] text-text-secondary">No decisions waiting. All clear.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {groups.map(g => (
            <DecisionRow key={g.type} group={g} />
          ))}
          <div className="px-4 py-2.5 flex items-center justify-between">
            <p className="text-[10px] text-text-muted">
              DONNA guides. You decide. Nothing changes until you approve.
            </p>
            <Link
              href="/director/review"
              className="text-[11px] text-lime hover:opacity-80 font-medium shrink-0"
            >
              Open full queue →
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
