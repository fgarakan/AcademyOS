import Link from 'next/link'
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { DonnaReviewFeedbackChip } from './DonnaReviewFeedbackChip'

interface RecommendedAction {
  label: string
  href: string
  count: number
  urgency: 'high' | 'normal'
}

interface Props {
  totalPending: number
  needsApprovalCount: number
  playerUpdatesCount: number
  curriculumSessionCount: number
  readyToApplyCount: number
  staleDaysMax: number | null
  wrapUpsPending: number
  attendanceCount: number
  parentCommCount: number
  academyId?: string | null
}

function buildRecommendedAction(props: Props): RecommendedAction | null {
  const {
    wrapUpsPending,
    attendanceCount,
    parentCommCount,
    needsApprovalCount,
    playerUpdatesCount,
    curriculumSessionCount,
    staleDaysMax,
  } = props

  if (staleDaysMax !== null && staleDaysMax >= 7) {
    if (needsApprovalCount > 0) {
      return { label: 'Review stale wrap-ups and attendance items', href: '/director/review?tab=needs-approval', count: needsApprovalCount, urgency: 'high' }
    }
    if (playerUpdatesCount > 0) {
      return { label: 'Review stale player updates', href: '/director/review?tab=player-updates', count: playerUpdatesCount, urgency: 'high' }
    }
  }

  if (wrapUpsPending > 0) {
    return { label: 'Start with coach wrap-ups', href: '/director/review?tab=needs-approval', count: wrapUpsPending, urgency: 'normal' }
  }
  if (attendanceCount > 0) {
    return { label: 'Review attendance exceptions', href: '/director/review?tab=needs-approval', count: attendanceCount, urgency: 'normal' }
  }
  if (parentCommCount > 0) {
    return { label: 'Review parent communication drafts', href: '/director/review?tab=needs-approval', count: parentCommCount, urgency: 'normal' }
  }
  if (playerUpdatesCount > 0) {
    return { label: 'Review player observation and summary drafts', href: '/director/review?tab=player-updates', count: playerUpdatesCount, urgency: 'normal' }
  }
  if (curriculumSessionCount > 0) {
    return { label: 'Review curriculum and session recap drafts', href: '/director/review?tab=curriculum-session', count: curriculumSessionCount, urgency: 'normal' }
  }
  return null
}

export function DonnaReviewBriefPanel(props: Props) {
  const {
    totalPending,
    needsApprovalCount,
    playerUpdatesCount,
    curriculumSessionCount,
    readyToApplyCount,
    staleDaysMax,
    wrapUpsPending,
    attendanceCount,
    parentCommCount,
    academyId,
  } = props

  const recommended = buildRecommendedAction(props)
  const isStale = staleDaysMax !== null && staleDaysMax >= 7

  if (totalPending === 0 && readyToApplyCount === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <Sparkles className="w-4 h-4 text-lime shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-text-primary">Queue clear</p>
          <p className="text-[11px] text-text-muted">No items are waiting for review. DONNA will surface new items here as coaches submit wrap-ups and notes.</p>
        </div>
        <ShieldCheck className="w-4 h-4 text-status-green shrink-0" />
      </div>
    )
  }

  return (
    <div className={`rounded-xl border px-4 py-4 space-y-3 ${isStale ? 'bg-status-orange/5 border-status-orange/20' : 'bg-surface-raised border-lime/15'}`}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className={`w-4 h-4 shrink-0 ${isStale ? 'text-status-orange' : 'text-lime'}`} />
        <p className={`text-[10px] uppercase tracking-widest font-semibold ${isStale ? 'text-status-orange' : 'text-lime'}`}>
          DONNA
        </p>
        <span className="text-[10px] text-text-muted">Director Review Brief</span>
      </div>

      {/* Summary line */}
      <p className="text-sm text-text-primary">
        {isStale
          ? `You have ${totalPending} item${totalPending !== 1 ? 's' : ''} pending — some are over ${staleDaysMax} day${staleDaysMax !== 1 ? 's' : ''} old. Here is what needs attention first.`
          : `You have ${totalPending} item${totalPending !== 1 ? 's' : ''} waiting for review. Here is what to start with.`}
      </p>

      {/* Breakdown chips */}
      <div className="flex flex-wrap gap-2">
        {needsApprovalCount > 0 && (
          <Link href="/director/review?tab=needs-approval" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-status-orange/10 border border-status-orange/20 text-status-orange hover:bg-status-orange/20 transition-colors">
            {needsApprovalCount} needs approval
          </Link>
        )}
        {playerUpdatesCount > 0 && (
          <Link href="/director/review?tab=player-updates" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-status-blue/10 border border-status-blue/20 text-status-blue hover:bg-status-blue/20 transition-colors">
            {playerUpdatesCount} player updates
          </Link>
        )}
        {curriculumSessionCount > 0 && (
          <Link href="/director/review?tab=curriculum-session" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-lime/10 border border-lime/20 text-lime hover:bg-lime/20 transition-colors">
            {curriculumSessionCount} curriculum / session
          </Link>
        )}
        {readyToApplyCount > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-status-green/10 border border-status-green/20 text-status-green">
            {readyToApplyCount} approved — ready to apply
          </span>
        )}
        {wrapUpsPending > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface border border-border text-text-secondary">
            {wrapUpsPending} wrap-up{wrapUpsPending !== 1 ? 's' : ''}
          </span>
        )}
        {attendanceCount > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface border border-border text-text-secondary">
            {attendanceCount} attendance exception{attendanceCount !== 1 ? 's' : ''}
          </span>
        )}
        {parentCommCount > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface border border-border text-text-secondary">
            {parentCommCount} parent comm draft{parentCommCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Recommended action */}
      {recommended && (
        <div>
          <Link
            href={recommended.href}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${recommended.urgency === 'high' ? 'bg-status-orange/10 border border-status-orange/30 text-status-orange hover:bg-status-orange/20' : 'bg-lime/10 border border-lime/20 text-lime hover:bg-lime/20'}`}
          >
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            <span>Start here: {recommended.label}</span>
            <span className="ml-auto font-mono tabular-nums">{recommended.count}</span>
          </Link>
          {/* Sprint 916 — feedback chip: fire-and-forget logging, never blocks navigation */}
          {academyId && (
            <DonnaReviewFeedbackChip
              href={recommended.href}
              recommendationText={`Start here: ${recommended.label}`}
              recommendationType="review_queue"
            />
          )}
        </div>
      )}

      {/* Safety notice */}
      <p className="text-[10px] text-text-muted flex items-center gap-1.5 pt-0.5">
        <ShieldCheck className="w-3 h-3 shrink-0 text-text-muted" />
        DONNA surfaces items — you review and approve. Nothing is applied automatically.
      </p>
    </div>
  )
}
