// Sprint 538 — Knowledge Ingestion Types
// Core types for ingesting external knowledge into the library.
// DOCTRINE: All ingestion produces pending_review items only.
// No auto-approval, no auto-promotion. Platform owner reviews first.
// Do NOT scrape copyrighted content, bypass paywalls, or violate ToS.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeDomain, KnowledgeSourceType } from './knowledgeTypes'

export type IngestionMethod =
  | 'manual_entry'
  | 'coach_voice_submission'
  | 'director_voice_submission'
  | 'structured_import'
  | 'url_metadata_only'

export type IngestionStatus =
  | 'draft'
  | 'submitted'
  | 'failed_validation'
  | 'queued_for_review'
  | 'processed'

export interface IngestionPayload {
  ingestionId: string
  method: IngestionMethod
  submittedBy: string
  submittedByRole: 'coach' | 'head_coach' | 'academy_director' | 'platform_owner'
  academyId: string
  rawTitle: string
  rawSummary: string
  rawBody: string | null
  rawSourceUrl: string | null
  rawSourceAuthor: string | null
  rawSourceYear: number | null
  inferredDomain: KnowledgeDomain | null
  inferredSourceType: KnowledgeSourceType | null
  suggestedTags: string[]
  status: IngestionStatus
  validationErrors: string[]
  submittedAt: string
}

export interface IngestionValidationResult {
  ingestionId: string
  isValid: boolean
  errors: string[]
  warnings: string[]
  autoInferredDomain: KnowledgeDomain | null
  autoInferredSourceType: KnowledgeSourceType | null
  safetyCheckPassed: boolean
  safetyFlags: string[]
}

export const INGESTION_CONTENT_SAFETY_PATTERNS = [
  { pattern: 'copyrighted', flag: 'Possible copyright reference' },
  { pattern: 'full text', flag: 'Possible full-text content — verify copyright' },
  { pattern: 'confidential', flag: 'Possible confidential content' },
  { pattern: 'proprietary', flag: 'Possible proprietary content' },
  { pattern: 'player name', flag: 'Possible player name in body — check privacy' },
  { pattern: 'date of birth', flag: 'Possible PII — check privacy' },
]

export function getIngestionMethodLabel(method: IngestionMethod): string {
  const labels: Record<IngestionMethod, string> = {
    manual_entry: 'Manual entry',
    coach_voice_submission: 'Coach voice submission',
    director_voice_submission: 'Director voice submission',
    structured_import: 'Structured import',
    url_metadata_only: 'URL metadata only',
  }
  return labels[method]
}

export function getIngestionStatusLabel(status: IngestionStatus): string {
  const labels: Record<IngestionStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    failed_validation: 'Failed validation',
    queued_for_review: 'Queued for review',
    processed: 'Processed',
  }
  return labels[status]
}
