import Link from 'next/link'
import { ClipboardList, ArrowRight } from 'lucide-react'

interface Props {
  totalPending: number
  wrapUpsCount: number
  assessmentsCount: number
  placementReviewsCount: number
  lessonRequestsCount: number
}

export function DirectorReviewDecideZone({
  totalPending,
  wrapUpsCount,
  assessmentsCount,
  placementReviewsCount,
  lessonRequestsCount,
}: Props) {
  const breakdown = [
    wrapUpsCount > 0 && `${wrapUpsCount} wrap-up${wrapUpsCount !== 1 ? 's' : ''}`,
    assessmentsCount > 0 && `${assessmentsCount} assessment${assessmentsCount !== 1 ? 's' : ''}`,
    placementReviewsCount > 0 && `${placementReviewsCount} placement${placementReviewsCount !== 1 ? 's' : ''}`,
    lessonRequestsCount > 0 && `${lessonRequestsCount} lesson request${lessonRequestsCount !== 1 ? 's' : ''}`,
  ].filter(Boolean) as string[]

  return (
    <div
      className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-4"
      data-donna-focus-id="review-decide-zone"
    >
      <div className="w-9 h-9 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
        <ClipboardList className="w-4 h-4 text-lime" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Review &amp; Decide</p>
          {totalPending > 0 && (
            <span className="font-mono text-[11px] font-bold text-status-orange bg-status-orange/10 border border-status-orange/30 px-1.5 py-0.5 rounded-full leading-none">
              {totalPending}
            </span>
          )}
        </div>
        {breakdown.length > 0 ? (
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {breakdown.join(' · ')}
          </p>
        ) : (
          <p className="text-[12px] text-status-green">Nothing pending review right now.</p>
        )}
      </div>
      <Link
        href="/director/review"
        className="shrink-0 btn-lime text-[11px] px-3 py-1.5 flex items-center gap-1.5"
      >
        Open <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
