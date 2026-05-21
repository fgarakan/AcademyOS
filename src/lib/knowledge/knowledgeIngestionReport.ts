// Sprint 545 — Knowledge Ingestion Report
// End-to-end ingestion phase report — what came in, what passed, what was classified, what needs review.
// Provides the platform owner and director with a clear ingestion audit.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { IngestionPayload, IngestionMethod } from './knowledgeIngestionTypes'
import type { KnowledgeDomain } from './knowledgeTypes'

export interface IngestionPhaseReport {
  reportId: string
  generatedAt: string
  periodStart: string
  periodEnd: string
  totalSubmissions: number
  validSubmissions: number
  invalidSubmissions: number
  queuedForReview: number
  processedCount: number
  byMethod: Record<IngestionMethod, number>
  byDomain: Partial<Record<KnowledgeDomain, number>>
  topSubmitters: Array<{ submittedBy: string; count: number }>
  safetyFlagCount: number
  requiresDirectorReview: true
  neverAutoPromotes: true
  summary: string
}

export function buildIngestionPhaseReport(
  payloads: IngestionPayload[],
  periodStart: string,
  periodEnd: string,
): IngestionPhaseReport {
  const reportId = `ipr_${Date.now()}`
  const generatedAt = new Date().toISOString()

  const byMethod: Record<IngestionMethod, number> = {
    manual_entry: 0,
    coach_voice_submission: 0,
    director_voice_submission: 0,
    structured_import: 0,
    url_metadata_only: 0,
  }
  const byDomain: Partial<Record<KnowledgeDomain, number>> = {}
  const submitterCounts: Map<string, number> = new Map()

  for (const p of payloads) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + 1
    if (p.inferredDomain !== null) {
      byDomain[p.inferredDomain] = (byDomain[p.inferredDomain] ?? 0) + 1
    }
    const prev = submitterCounts.get(p.submittedBy) ?? 0
    submitterCounts.set(p.submittedBy, prev + 1)
  }

  const validSubmissions = payloads.filter(p => p.status === 'queued_for_review' || p.status === 'processed').length
  const invalidSubmissions = payloads.filter(p => p.status === 'failed_validation').length
  const queuedForReview = payloads.filter(p => p.status === 'queued_for_review').length
  const processedCount = payloads.filter(p => p.status === 'processed').length
  const safetyFlagCount = payloads.filter(p => p.validationErrors.length > 0).length

  const topSubmitters = Array.from(submitterCounts.keys())
    .map(submittedBy => ({ submittedBy, count: submitterCounts.get(submittedBy) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const summaryParts: string[] = []
  summaryParts.push(`${payloads.length} items submitted`)
  summaryParts.push(`${validSubmissions} valid`)
  if (invalidSubmissions > 0) summaryParts.push(`${invalidSubmissions} failed validation`)
  if (queuedForReview > 0) summaryParts.push(`${queuedForReview} queued for review`)

  return {
    reportId,
    generatedAt,
    periodStart,
    periodEnd,
    totalSubmissions: payloads.length,
    validSubmissions,
    invalidSubmissions,
    queuedForReview,
    processedCount,
    byMethod,
    byDomain,
    topSubmitters,
    safetyFlagCount,
    requiresDirectorReview: true,
    neverAutoPromotes: true,
    summary: summaryParts.join(' · '),
  }
}

export function getIngestionReportSummaryLine(report: IngestionPhaseReport): string {
  return `Ingestion report: ${report.summary}. Generated ${report.generatedAt}.`
}
