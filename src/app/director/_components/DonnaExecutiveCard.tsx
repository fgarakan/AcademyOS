import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'

export interface DonnaExecutivePriorityItem {
  id: string
  text: string
  actionLabel: string
  href: string
  variant: 'urgent' | 'review' | 'info'
}

interface Props {
  items: DonnaExecutivePriorityItem[]
  directorName?: string
}

const VARIANT_CHIP: Record<DonnaExecutivePriorityItem['variant'], string> = {
  urgent: 'bg-status-red/10 border-status-red/25 text-status-red',
  review: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400',
  info:   'bg-lime/10 border-lime/25 text-lime',
}

const NUM_RING: Record<DonnaExecutivePriorityItem['variant'], string> = {
  urgent: 'border-status-red/30 text-status-red',
  review: 'border-yellow-500/30 text-yellow-400',
  info:   'border-lime/30 text-lime',
}

export function DonnaExecutiveCard({ items, directorName }: Props) {
  const visibleItems = items.slice(0, 5)

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'linear-gradient(135deg, #111111 0%, #141414 100%)',
        border: '1px solid rgba(200,255,0,0.12)',
        boxShadow: '0 0 40px rgba(200,255,0,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)' }}
          >
            <Sparkles className="w-4 h-4 text-lime" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-lime/70">
              Donna — Executive Layer
            </p>
            <p className="text-sm font-semibold text-text-primary leading-tight mt-0.5">
              {visibleItems.length === 0
                ? 'All clear. Nothing urgent today.'
                : `Here are the ${visibleItems.length} thing${visibleItems.length !== 1 ? 's' : ''} that need${visibleItems.length === 1 ? 's' : ''} your attention today.`}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-text-muted shrink-0 mt-1">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Priority rows */}
      {visibleItems.length === 0 ? (
        <p className="text-xs text-text-muted italic px-1">
          No priority items at this time. Donna will surface items as your academy generates activity.
        </p>
      ) : (
        <ol className="space-y-2">
          {visibleItems.map((item, idx) => (
            <li key={item.id}>
              {/* Sprint 659 — "Do this first" label on top item */}
              {idx === 0 && (
                <p className="text-[9px] uppercase tracking-widest font-bold text-lime/60 px-1 mb-1">
                  Do this first
                </p>
              )}
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors group"
                style={{ border: idx === 0 ? '1px solid rgba(200,255,0,0.12)' : '1px solid rgba(255,255,255,0.04)' }}
              >
                {/* Number ring */}
                <span
                  className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[11px] font-bold ${NUM_RING[item.variant]}`}
                >
                  {idx + 1}
                </span>

                {/* Text */}
                <p className="flex-1 min-w-0 text-sm text-text-primary leading-snug">
                  {item.text}
                </p>

                {/* Action chip */}
                <span
                  className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${VARIANT_CHIP[item.variant]}`}
                >
                  {item.actionLabel}
                </span>

                <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      )}

      {/* Footer note */}
      <p
        className="text-[10px] text-text-muted px-1 leading-snug"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}
      >
        Donna flags items but takes no action without your explicit approval.
        All changes go through the review queue.
      </p>
    </div>
  )
}
