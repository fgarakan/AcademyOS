// Sprint 1015 — Review Queue Context Packaging V1
// Packages DonnaReviewQueueSummary into a DONNA-ready context bundle.
// Adds category grouping, COO signals, health assessment, priority ordering.
// Pure transformation — no DB calls. No DB writes.

import type {
  DonnaReviewQueueSummary,
  DonnaReviewItem,
  DonnaReviewItemType,
} from '@/components/assistant/donnaReviewQueueTypes'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Category grouping ─────────────────────────────────────────────────────────

export type ReviewCategory =
  | 'coach_notes'
  | 'parent_updates'
  | 'level_readiness'
  | 'curriculum'
  | 'sessions'
  | 'other'

const TYPE_TO_CATEGORY: Record<DonnaReviewItemType, ReviewCategory> = {
  coach_note_pending_review: 'coach_notes',
  unlinked_voice_note: 'coach_notes',
  session_needs_blocks: 'sessions',
  parent_update_pending_review: 'parent_updates',
  level_readiness_pending_review: 'level_readiness',
  curriculum_adjustment_pending_review: 'curriculum',
  coach_communication_pending_review: 'coach_notes',
  unknown: 'other',
}

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  coach_notes: 'Coach notes',
  parent_updates: 'Parent updates',
  level_readiness: 'Level readiness',
  curriculum: 'Curriculum',
  sessions: 'Sessions',
  other: 'Other',
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface ReviewQueueCategoryGroup {
  category: ReviewCategory
  label: string
  count: number
  highPriorityCount: number
  items: DonnaReviewItem[]
  reviewHref: string
  urgency: 'high' | 'medium' | 'low'
  safetyNote: string | null
}

export interface ReviewQueueHealthSignal {
  status: 'clear' | 'pending' | 'overdue' | 'backlog'
  label: string
  totalPending: number
  oldestItemDaysAgo: number | null
  highPriorityCount: number
}

export interface ReviewQueueContextPackage {
  // Health
  health: ReviewQueueHealthSignal
  // Categories
  categories: ReviewQueueCategoryGroup[]
  // Flat priority list (top 5)
  topItems: DonnaReviewItem[]
  // Summary text for DONNA answer
  summaryText: string
  // Meta
  confidence: DONNAConfidence
  isLive: boolean
  fetchedAt: string
}

// ── Health signal builder ─────────────────────────────────────────────────────

function buildHealthSignal(
  items: DonnaReviewItem[],
  totalPending: number,
): ReviewQueueHealthSignal {
  const highPriorityCount = items.filter(i => i.priority === 'high').length

  let oldestItemDaysAgo: number | null = null
  for (const item of items) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (oldestItemDaysAgo === null || daysAgo > oldestItemDaysAgo) {
      oldestItemDaysAgo = daysAgo
    }
  }

  let status: ReviewQueueHealthSignal['status']
  let label: string

  if (totalPending === 0) {
    status = 'clear'
    label = 'All clear — nothing pending review'
  } else if (oldestItemDaysAgo !== null && oldestItemDaysAgo >= 3) {
    status = 'overdue'
    label = `${totalPending} item${totalPending !== 1 ? 's' : ''} pending — oldest is ${oldestItemDaysAgo} days old`
  } else if (totalPending >= 10) {
    status = 'backlog'
    label = `${totalPending} items pending — backlog building`
  } else {
    status = 'pending'
    label = `${totalPending} item${totalPending !== 1 ? 's' : ''} pending review`
  }

  return { status, label, totalPending, oldestItemDaysAgo, highPriorityCount }
}

// ── Category builder ──────────────────────────────────────────────────────────

function buildCategoryGroups(items: DonnaReviewItem[]): ReviewQueueCategoryGroup[] {
  const buckets = new Map<ReviewCategory, DonnaReviewItem[]>()

  for (const item of items) {
    const cat = TYPE_TO_CATEGORY[item.type] ?? 'other'
    if (!buckets.has(cat)) buckets.set(cat, [])
    buckets.get(cat)!.push(item)
  }

  const groups: ReviewQueueCategoryGroup[] = []

  const ORDER: ReviewCategory[] = [
    'coach_notes',
    'parent_updates',
    'level_readiness',
    'curriculum',
    'sessions',
    'other',
  ]

  for (const cat of ORDER) {
    const catItems = buckets.get(cat)
    if (!catItems || catItems.length === 0) continue

    const highCount = catItems.filter(i => i.priority === 'high').length
    const urgency: 'high' | 'medium' | 'low' =
      highCount > 0 ? 'high' : catItems.length >= 3 ? 'medium' : 'low'

    let safetyNote: string | null = null
    if (cat === 'parent_updates') {
      safetyNote = 'Parent updates require director approval before any send'
    } else if (cat === 'level_readiness') {
      safetyNote = 'Level movement requires director decision — DONNA never moves levels automatically'
    }

    groups.push({
      category: cat,
      label: CATEGORY_LABELS[cat],
      count: catItems.length,
      highPriorityCount: highCount,
      items: catItems,
      reviewHref: '/director/review',
      urgency,
      safetyNote,
    })
  }

  return groups.sort((a, b) => {
    const ORDER = { high: 0, medium: 1, low: 2 }
    return ORDER[a.urgency] - ORDER[b.urgency]
  })
}

// ── Summary text builder ──────────────────────────────────────────────────────

function buildSummaryText(health: ReviewQueueHealthSignal, categories: ReviewQueueCategoryGroup[]): string {
  if (health.totalPending === 0) return 'Review queue is clear — nothing pending.'

  const lines: string[] = [`${health.totalPending} item${health.totalPending !== 1 ? 's' : ''} pending director review.`]

  for (const cat of categories) {
    if (cat.highPriorityCount > 0) {
      lines.push(`${cat.label}: ${cat.count} item${cat.count !== 1 ? 's' : ''} (${cat.highPriorityCount} high priority)`)
    } else {
      lines.push(`${cat.label}: ${cat.count} item${cat.count !== 1 ? 's' : ''}`)
    }
  }

  if (health.oldestItemDaysAgo !== null && health.oldestItemDaysAgo >= 2) {
    lines.push(`Oldest item is ${health.oldestItemDaysAgo} days old.`)
  }

  return lines.join(' ')
}

// ── Package builder ───────────────────────────────────────────────────────────

export function buildReviewQueueContextPackage(
  summary: DonnaReviewQueueSummary | null,
): ReviewQueueContextPackage {
  if (!summary) {
    return {
      health: {
        status: 'clear',
        label: 'No data available',
        totalPending: 0,
        oldestItemDaysAgo: null,
        highPriorityCount: 0,
      },
      categories: [],
      topItems: [],
      summaryText: 'Review queue data unavailable.',
      confidence: 'insufficient',
      isLive: false,
      fetchedAt: new Date().toISOString(),
    }
  }

  const pendingItems = summary.items.filter(
    i => i.status === 'pending_review' || i.status === 'needs_routing',
  )

  const health = buildHealthSignal(pendingItems, summary.pendingReviewCount)
  const categories = buildCategoryGroups(pendingItems)

  // Top 5: sort high > medium > low, then by createdAt desc
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
  const topItems = [...pendingItems]
    .sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pDiff !== 0) return pDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  const summaryText = buildSummaryText(health, categories)

  const confidence: DONNAConfidence =
    summary.totalCount > 0 ? 'high' : 'partial'

  return {
    health,
    categories,
    topItems,
    summaryText,
    confidence,
    isLive: true,
    fetchedAt: summary.fetchedAt,
  }
}
