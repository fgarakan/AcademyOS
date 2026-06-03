// Sprint 1691 — DONNA Academy Attention Engine V1
// Groups attention priorities into a typed AcademyAttentionReport.
// Builds on donnaAttentionRankingEngine — adds grouping, health signal, and
// the "proactive notice" interface (what DONNA surfaces without being asked).
//
// Design rules:
//   - No analytics soup. Only what matters, why, evidence, next action.
//   - Deterministic. No LLM. Same ctx → same output.
//   - No DB calls. No mutations. No side effects.
//   - Max 8 items total surfaced. Top action always fully detailed.
//   - Empty states are honest — no invented signals.
//
// Usage:
//   const report = buildAcademyAttentionReport(directorCtx)
//   report.healthSignal   // 'clear' | 'attention_needed' | 'critical'
//   report.topAction      // highest-leverage item or null
//   report.groups         // items grouped by category
//   report.isEmpty        // true when academy is clear

import {
  buildAttentionPriorities,
  type DonnaAttentionPriority,
  type DonnaAttentionCategory,
} from '@/lib/donna/donnaAttentionRankingEngine'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AcademyHealthSignal = 'clear' | 'attention_needed' | 'critical'

/** A single attention item exposed in the proactive layer */
export interface AcademyAttentionItem extends DonnaAttentionPriority {
  /** Short label for the category, human-readable */
  categoryLabel: string
}

/** Items grouped by attention category */
export interface AcademyAttentionGroup {
  category:     DonnaAttentionCategory
  categoryLabel: string
  items:        AcademyAttentionItem[]
  /** Highest severity in this group */
  topSeverity:  DonnaAttentionPriority['severity']
}

/** Full proactive academy attention report */
export interface AcademyAttentionReport {
  /** Overall academy health signal */
  healthSignal:    AcademyHealthSignal
  /** Short description of health signal */
  healthSummary:   string
  /** Highest-scoring item — the single best place to start */
  topAction:       AcademyAttentionItem | null
  /** All items sorted by score, max 8 */
  allItems:        AcademyAttentionItem[]
  /** Items grouped by category */
  groups:          AcademyAttentionGroup[]
  /** Total item count */
  totalCount:      number
  /** True when no signals are active */
  isEmpty:         boolean
  /** Whether any item requires director approval */
  hasApprovalItems: boolean
  /** Source label for trust/transparency */
  sourceNote:      string
}

// ─── Category label map ─────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DonnaAttentionCategory, string> = {
  safety:             'Safety',
  parent_records:     'Parent Records',
  player_development: 'Player Development',
  coach_execution:    'Coach Execution',
  review_queue:       'Review Queue',
  curriculum:         'Curriculum',
  onboarding:         'Onboarding',
  sessions:           'Sessions',
  system:             'System',
}

// ─── Health signal deriver ──────────────────────────────────────────────────────

function deriveHealthSignal(items: DonnaAttentionPriority[]): AcademyHealthSignal {
  if (items.length === 0) return 'clear'
  const hasCritical = items.some(i => i.severity === 'critical')
  if (hasCritical) return 'critical'
  return 'attention_needed'
}

function buildHealthSummary(signal: AcademyHealthSignal, count: number): string {
  if (signal === 'clear')            return 'Academy is operating normally — no urgent signals.'
  if (signal === 'critical')         return `${count} item${count !== 1 ? 's' : ''} require immediate attention.`
  return `${count} item${count !== 1 ? 's' : ''} need your review.`
}

// ─── Main builder ──────────────────────────────────────────────────────────────

export function buildAcademyAttentionReport(
  ctx: DirectorDonnaContext,
): AcademyAttentionReport {
  const raw = buildAttentionPriorities(ctx).slice(0, 8)

  const allItems: AcademyAttentionItem[] = raw.map(p => ({
    ...p,
    categoryLabel: CATEGORY_LABELS[p.category] ?? p.category,
  }))

  const topAction = allItems[0] ?? null
  const healthSignal = deriveHealthSignal(raw)
  const healthSummary = buildHealthSummary(healthSignal, allItems.length)

  // Build groups using a plain object to avoid Map iteration target issues
  const groupObj: Partial<Record<DonnaAttentionCategory, AcademyAttentionItem[]>> = {}
  for (const item of allItems) {
    const existing = groupObj[item.category] ?? []
    existing.push(item)
    groupObj[item.category] = existing
  }

  const severityOrder: DonnaAttentionPriority['severity'][] = ['critical', 'high', 'medium', 'low']
  const groups: AcademyAttentionGroup[] = (Object.keys(groupObj) as DonnaAttentionCategory[]).map(category => {
    const items = groupObj[category]!
    const topSeverity = severityOrder.find(s => items.some(item => item.severity === s)) ?? 'low'
    return {
      category,
      categoryLabel: CATEGORY_LABELS[category] ?? category,
      items,
      topSeverity,
    }
  })
  // Sort groups by their highest-scoring item
  groups.sort((a, b) => (b.items[0]?.score ?? 0) - (a.items[0]?.score ?? 0))

  return {
    healthSignal,
    healthSummary,
    topAction,
    allItems,
    groups,
    totalCount:       allItems.length,
    isEmpty:          allItems.length === 0,
    hasApprovalItems: allItems.some(i => i.requiresApproval),
    sourceNote:       ctx.isLive ? 'Live academy data' : 'Demo data',
  }
}

// ─── Convenience: get items for a specific category ────────────────────────────

export function getAttentionItemsByCategory(
  report: AcademyAttentionReport,
  category: DonnaAttentionCategory,
): AcademyAttentionItem[] {
  return report.allItems.filter(i => i.category === category)
}

// ─── Convenience: proactive notice text (used in COO status surfaces) ──────────

export function buildProactiveNoticeText(report: AcademyAttentionReport): string {
  if (report.isEmpty) {
    return 'No urgent signals right now. Academy is operating normally.'
  }
  const lines: string[] = []
  report.allItems.slice(0, 4).forEach((item, i) => {
    lines.push(`${i + 1}. ${item.label}`)
  })
  if (report.totalCount > 4) {
    lines.push(`…and ${report.totalCount - 4} more item${report.totalCount - 4 !== 1 ? 's' : ''}.`)
  }
  return lines.join('\n')
}
