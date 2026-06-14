// Sprint 2381–2410 — DONNA Daily Brief + Academy Pulse V1
// Shows a compact summary of what happened in the last DONNA session.
// Reads from Tier 1 memory (donna_conversation_sessions) — pre-loaded server-side.
//
// Render rules:
//   - Only renders when sessions exist AND last session ended > 30min ago
//   - Max 3 items: completed actions (checkmark) + open items (warning)
//   - Never shows stale "Brief session" summaries with no actual content

import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui'
import type { PriorSessionContext } from '@/lib/donna/memory/donnaMemoryContextTypes'

interface Props {
  priorSessionContext: PriorSessionContext | null
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'recently'
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)   return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export function SinceYourLastVisitPanel({ priorSessionContext }: Props) {
  if (!priorSessionContext || priorSessionContext.sessions.length === 0) return null

  const session = priorSessionContext.sessions[0]

  // Don't show if the session ended less than 30 minutes ago (same-visit scenario)
  if (session.endedAt) {
    const ageMs = Date.now() - new Date(session.endedAt).getTime()
    if (ageMs < 30 * 60 * 1000) return null
  }

  // Build max-3 items list: completed actions first, then open items
  const completedItems = session.actionsCompleted.slice(0, 2)
  const openItems      = session.openItems.slice(0, 1)

  type Item = { type: 'completed' | 'open'; text: string }
  const items: Item[] = [
    ...completedItems.map(a => ({ type: 'completed' as const, text: a })),
    ...openItems.map(o => ({ type: 'open' as const, text: o })),
  ].slice(0, 3)

  // Only render if we have meaningful content
  const hasContent = items.length > 0 ||
    (session.sessionSummaryText && !session.sessionSummaryText.startsWith('Brief session'))

  if (!hasContent) return null

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={13} className="text-text-muted shrink-0" />
        <span className="label-xs text-text-muted">
          SINCE YOUR LAST VISIT — {relativeTime(session.endedAt)}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              {item.type === 'completed' ? (
                <CheckCircle2 size={13} className="text-status-green shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={13} className="text-status-orange shrink-0 mt-0.5" />
              )}
              <span className="text-sm text-text-secondary leading-snug">{item.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary leading-relaxed">
          {session.sessionSummaryText}
        </p>
      )}
    </Card>
  )
}
