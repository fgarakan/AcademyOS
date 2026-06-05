import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { AttentionQueue } from '@/lib/director/attentionQueue'

interface Props {
  attentionQueue: AttentionQueue | null
}

function PriorityDot({ priority }: { priority: string }) {
  const colorClass =
    priority === 'critical' ? 'bg-status-red' :
    priority === 'high'     ? 'bg-status-orange' :
    priority === 'medium'   ? 'bg-yellow-400' :
    'bg-text-muted'
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${colorClass}`} />
}

export function DirectorTopPriorities({ attentionQueue }: Props) {
  const items = (attentionQueue?.items ?? []).slice(0, 3)

  return (
    <section className="space-y-1.5">
      <p className="label-xs">Top Priorities</p>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] text-text-secondary">No priority items right now.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <PriorityDot priority={item.priority} />
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-[13px] font-semibold text-text-primary leading-snug">{item.label}</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap pt-0.5"
              >
                Act <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
