// Sprint 921 — DONNA Recommendation Learning Dashboard V1
// Loads aggregate recommendation feedback signals for director display.
// Safe aggregate counts only — no raw IDs, no sensitive content.
// Read-only. No mutations. RLS-scoped to academy.

import type { DB } from '@/lib/types/db'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RecommendationFeedbackSummary {
  acceptedCount: number
  rejectedCount: number
  deferredCount: number
  ignoredCount: number
  totalCount: number
  acceptanceRate: number | null   // 0–1, null if no data
  rejectionRate: number | null
  topRecommendationType: string | null
  topRejectedType: string | null
  recentFeedbackCount: number     // last 30 days
  hasData: boolean
}

// ── Loader ─────────────────────────────────────────────────────────────────────

export async function loadRecommendationFeedbackSummary(
  db: DB,
  academyId: string,
): Promise<RecommendationFeedbackSummary> {
  const empty: RecommendationFeedbackSummary = {
    acceptedCount: 0, rejectedCount: 0, deferredCount: 0, ignoredCount: 0,
    totalCount: 0, acceptanceRate: null, rejectionRate: null,
    topRecommendationType: null, topRejectedType: null,
    recentFeedbackCount: 0, hasData: false,
  }

  try {
    const rawDb = db as any

    // 1. Aggregate feedback counts
    const { data: feedbackRows } = await rawDb
      .from('donna_recommendation_feedback')
      .select('feedback_status')
      .eq('academy_id', academyId)

    if (!feedbackRows || feedbackRows.length === 0) return empty

    const counts = { accepted: 0, rejected: 0, deferred: 0, ignored: 0, modified: 0 }
    for (const row of feedbackRows as Array<{ feedback_status: string }>) {
      const s = row.feedback_status
      if (s === 'accepted') counts.accepted++
      else if (s === 'rejected') counts.rejected++
      else if (s === 'deferred') counts.deferred++
      else if (s === 'ignored') counts.ignored++
      else if (s === 'modified') counts.modified++
    }
    const total = feedbackRows.length
    const acceptanceRate = total > 0 ? counts.accepted / total : null
    const rejectionRate = total > 0 ? counts.rejected / total : null

    // 2. Top recommendation type (most accepted)
    const { data: recRows } = await rawDb
      .from('donna_recommendations')
      .select('recommendation_type, status')
      .eq('academy_id', academyId)
      .eq('status', 'acted_on')
      .order('created_at', { ascending: false })
      .limit(50)

    const typeCounts = new Map<string, number>()
    for (const row of (recRows as Array<{ recommendation_type: string }> ?? [])) {
      typeCounts.set(row.recommendation_type, (typeCounts.get(row.recommendation_type) ?? 0) + 1)
    }
    let topRecommendationType: string | null = null
    let topCount = 0
    for (const [type, count] of Array.from(typeCounts.entries())) {
      if (count > topCount) { topCount = count; topRecommendationType = type }
    }

    // 3. Top rejected type
    const { data: rejectedRows } = await rawDb
      .from('donna_recommendations')
      .select('recommendation_type')
      .eq('academy_id', academyId)
      .eq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .limit(50)

    const rejTypeCounts = new Map<string, number>()
    for (const row of (rejectedRows as Array<{ recommendation_type: string }> ?? [])) {
      rejTypeCounts.set(row.recommendation_type, (rejTypeCounts.get(row.recommendation_type) ?? 0) + 1)
    }
    let topRejectedType: string | null = null
    let topRejCount = 0
    for (const [type, count] of Array.from(rejTypeCounts.entries())) {
      if (count > topRejCount) { topRejCount = count; topRejectedType = type }
    }

    // 4. Recent feedback count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await rawDb
      .from('donna_recommendation_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .gte('created_at', thirtyDaysAgo)

    return {
      acceptedCount: counts.accepted,
      rejectedCount: counts.rejected,
      deferredCount: counts.deferred,
      ignoredCount: counts.ignored,
      totalCount: total,
      acceptanceRate,
      rejectionRate,
      topRecommendationType,
      topRejectedType,
      recentFeedbackCount: recentCount ?? 0,
      hasData: true,
    }
  } catch {
    return empty
  }
}

// ── Safe DONNA summary ─────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  operating_priority: 'Operating Priorities',
  review_queue:       'Review Queue Guidance',
  onboarding_guide:   'Onboarding Steps',
  curriculum_gap:     'Curriculum Gaps',
  player_attention:   'Player Attention',
}

export function formatLearningSignalsForDonna(summary: RecommendationFeedbackSummary): string {
  if (!summary.hasData) {
    return 'No recommendation feedback data yet. As you interact with DONNA\'s suggestions, I\'ll track what\'s useful and what\'s not.'
  }
  const rate = summary.acceptanceRate !== null
    ? `${Math.round(summary.acceptanceRate * 100)}%`
    : 'unknown'
  const top = summary.topRecommendationType
    ? `Most accepted type: **${TYPE_LABELS[summary.topRecommendationType] ?? summary.topRecommendationType}**.`
    : ''
  const rejected = summary.topRejectedType && summary.rejectedCount > 2
    ? `Most often dismissed: **${TYPE_LABELS[summary.topRejectedType] ?? summary.topRejectedType}** — I\'ll adjust my emphasis.`
    : ''
  return `I\'ve logged ${summary.totalCount} recommendation interactions.\n\nAcceptance rate: **${rate}** (${summary.acceptedCount} acted on, ${summary.rejectedCount} dismissed). ${top} ${rejected}\n\nThis data helps me improve what I surface.`
}
