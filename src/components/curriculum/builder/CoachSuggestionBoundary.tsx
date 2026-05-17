import { Info } from 'lucide-react'

export function CoachSuggestionBoundary() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-status-blue shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">Coach suggestions</p>
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">
        Coaches can submit curriculum feedback through their session wrap-up flow. Their suggestions appear
        in the Director Review Queue — they do not have direct editing access to curriculum content.
      </p>
      <p className="text-[11px] text-text-muted leading-relaxed">
        This boundary exists to protect curriculum integrity: a single coach&apos;s session experience
        should inform but not override academy-wide curriculum decisions.
      </p>
      <div className="rounded-xl border border-border bg-surface-raised px-3 py-2">
        <p className="text-[10px] text-text-muted">
          To review coach curriculum suggestions: <span className="text-lime font-semibold">Review Queue → filter by source: coach</span>
        </p>
      </div>
    </div>
  )
}
