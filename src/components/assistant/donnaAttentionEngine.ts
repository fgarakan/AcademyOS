// Sprint 370 — Donna What Needs Attention Engine V1
// Pure utility types. No React, no DB, no API.

// ── Types ──────────────────────────────────────────────────────────────────────

export type AttentionUrgency = 'critical' | 'high' | 'normal'
export type AttentionCategory = 'review' | 'placement' | 'scheduling' | 'communication' | 'curriculum'

export interface AttentionItem {
  id: string
  urgency: AttentionUrgency
  category: AttentionCategory
  title: string
  description: string
  action?: string   // action label
  link?: string     // href to navigate to
}

export interface AttentionReport {
  generatedAt: string
  items: AttentionItem[]
  hasUrgent: boolean
}

// ── Utilities ──────────────────────────────────────────────────────────────────

const URGENCY_ORDER: Record<AttentionUrgency, number> = {
  critical: 0,
  high: 1,
  normal: 2,
}

/** Sort attention items by urgency (critical first). */
export function sortAttentionItems(items: AttentionItem[]): AttentionItem[] {
  return [...items].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency],
  )
}

/** Format the attention report as a human-readable summary string. */
export function formatAttentionSummary(report: AttentionReport): string {
  if (report.items.length === 0) return 'No urgent items. All clear.'
  const urgentCount = report.items.filter(i => i.urgency === 'critical' || i.urgency === 'high').length
  const lines = [
    urgentCount > 0
      ? `${urgentCount} item${urgentCount !== 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} your attention now.`
      : `${report.items.length} item${report.items.length !== 1 ? 's' : ''} to review.`,
  ]
  for (const item of report.items.slice(0, 3)) {
    lines.push(`· ${item.title}: ${item.description}`)
  }
  if (report.items.length > 3) {
    lines.push(`…and ${report.items.length - 3} more.`)
  }
  return lines.join('\n')
}
