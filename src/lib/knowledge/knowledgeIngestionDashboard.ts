// Sprint 543 — Knowledge Ingestion Dashboard
// Director-facing view of the knowledge ingestion pipeline.
// Shows what has come in, what needs review, and what has been processed.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { IngestionPayload, IngestionStatus, IngestionMethod } from './knowledgeIngestionTypes'

export interface IngestionDashboardView {
  totalSubmissions: number
  pendingValidation: number
  queuedForReview: number
  processed: number
  failedValidation: number
  byMethod: Record<IngestionMethod, number>
  byStatus: Record<IngestionStatus, number>
  recentSubmissions: IngestionPayload[]
  failedItems: IngestionPayload[]
  requiresAttentionCount: number
  isQueueHealthy: boolean
  queueSummary: string
}

export function buildIngestionDashboardView(
  payloads: IngestionPayload[],
  recentLimit = 5,
): IngestionDashboardView {
  const byMethod: Record<IngestionMethod, number> = {
    manual_entry: 0,
    coach_voice_submission: 0,
    director_voice_submission: 0,
    structured_import: 0,
    url_metadata_only: 0,
  }
  const byStatus: Record<IngestionStatus, number> = {
    draft: 0,
    submitted: 0,
    failed_validation: 0,
    queued_for_review: 0,
    processed: 0,
  }

  for (const p of payloads) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + 1
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
  }

  const sorted = [...payloads].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )

  const recentSubmissions = sorted.slice(0, recentLimit)
  const failedItems = sorted.filter(p => p.status === 'failed_validation')
  const queuedForReview = byStatus.queued_for_review
  const failedValidation = byStatus.failed_validation
  const requiresAttentionCount = queuedForReview + failedValidation
  const isQueueHealthy = failedValidation === 0 && queuedForReview < 20

  const summaryParts: string[] = []
  if (queuedForReview > 0) summaryParts.push(`${queuedForReview} queued for review`)
  if (failedValidation > 0) summaryParts.push(`${failedValidation} failed validation`)
  if (byStatus.processed > 0) summaryParts.push(`${byStatus.processed} processed`)
  const queueSummary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'Queue is empty.'

  return {
    totalSubmissions: payloads.length,
    pendingValidation: byStatus.submitted,
    queuedForReview,
    processed: byStatus.processed,
    failedValidation,
    byMethod,
    byStatus,
    recentSubmissions,
    failedItems,
    requiresAttentionCount,
    isQueueHealthy,
    queueSummary,
  }
}

export function getIngestionMethodBreakdown(
  view: IngestionDashboardView,
): Array<{ method: IngestionMethod; count: number; pct: number }> {
  const total = view.totalSubmissions
  return (Object.entries(view.byMethod) as Array<[IngestionMethod, number]>)
    .filter(([, count]) => count > 0)
    .map(([method, count]) => ({
      method,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}
