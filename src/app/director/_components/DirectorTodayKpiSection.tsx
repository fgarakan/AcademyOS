import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface KpiTile {
  count: number
  label: string
  href: string
  urgency?: 'orange' | 'red' | 'lime'
  zeroLabel?: string
}

function KpiCard({ count, label, href, urgency = 'orange', zeroLabel }: KpiTile) {
  const isAlert = count > 0
  const colorClass =
    !isAlert
      ? 'text-text-secondary'
      : urgency === 'red'
      ? 'text-status-red'
      : urgency === 'lime'
      ? 'text-lime'
      : 'text-status-orange'

  const borderClass = isAlert
    ? urgency === 'red'
      ? 'hover:border-status-red/30'
      : urgency === 'lime'
      ? 'hover:border-lime/30'
      : 'hover:border-status-orange/30'
    : 'hover:border-border'

  return (
    <Link href={href} className="block group">
      <div className={`bg-surface border border-border rounded-xl px-4 py-3.5 transition-colors ${borderClass} flex items-end justify-between gap-2`}>
        <div className="flex-1 min-w-0">
          <p className={`font-mono font-bold text-2xl leading-none ${colorClass}`}>
            {count}
          </p>
          <p className="text-[11px] text-text-muted mt-1.5 leading-snug">
            {count === 0 && zeroLabel ? zeroLabel : label}
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text-secondary transition-colors shrink-0 mb-0.5" />
      </div>
    </Link>
  )
}

interface DirectorTodayKpiSectionProps {
  playersNeedingAttention: number
  pendingOnboarding: number
  assessmentsNeedingReview: number
  playersReadyForReassessment: number
  parentUpdatesPendingApproval: number
  coachRecapsMissing: number
  activePlacementReviews: number
}

export function DirectorTodayKpiSection({
  playersNeedingAttention,
  pendingOnboarding,
  assessmentsNeedingReview,
  playersReadyForReassessment,
  parentUpdatesPendingApproval,
  coachRecapsMissing,
  activePlacementReviews,
}: DirectorTodayKpiSectionProps) {
  const tiles: KpiTile[] = [
    {
      count: playersNeedingAttention,
      label: 'Players need attention',
      href: '/director/attention?filter=players',
      urgency: 'orange',
      zeroLabel: 'Players on track',
    },
    {
      count: pendingOnboarding,
      label: 'Pending onboarding',
      href: '/director/attention?filter=onboarding',
      urgency: 'orange',
      zeroLabel: 'No pending onboarding',
    },
    {
      count: assessmentsNeedingReview,
      label: 'Assessments to review',
      href: '/director/review?tab=needs-approval',
      urgency: 'orange',
      zeroLabel: 'Assessments reviewed',
    },
    {
      count: playersReadyForReassessment,
      label: 'Ready for reassessment',
      href: '/director/attention?filter=reassessment',
      urgency: 'orange',
      zeroLabel: 'No reassessments due',
    },
    {
      count: parentUpdatesPendingApproval,
      label: 'Parent updates pending',
      href: '/director/attention?filter=parent-updates',
      urgency: 'orange',
      zeroLabel: 'Parent updates current',
    },
    {
      count: coachRecapsMissing,
      label: 'Coach recaps missing',
      href: '/director/attention?filter=coach',
      urgency: 'orange',
      zeroLabel: 'All recaps submitted',
    },
    {
      count: activePlacementReviews,
      label: 'Placement reviews active',
      href: '/director/attention?filter=placements',
      urgency: 'orange',
      zeroLabel: 'No active placements',
    },
  ]

  const totalAlerts = tiles.reduce((sum, t) => sum + t.count, 0)

  return (
    <div data-donna-focus-id="todays-kpi-section">
      <div className="flex items-center justify-between mb-3">
        <p className="label-xs">Today&apos;s Academy</p>
        {totalAlerts === 0 && (
          <span className="text-[11px] text-status-green font-medium">All clear</span>
        )}
        {totalAlerts > 0 && (
          <span className="text-[11px] text-status-orange font-medium">
            {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need attention
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <KpiCard key={tile.label} {...tile} />
        ))}
      </div>
    </div>
  )
}
