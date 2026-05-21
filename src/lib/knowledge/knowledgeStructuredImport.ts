// Sprint 541 — Knowledge Structured Import
// Handles structured data imports (CSV, JSON) into the knowledge library.
// All imports produce pending_review items. Platform owner reviews before approval.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeDomain, KnowledgeSourceType } from './knowledgeTypes'
import type { IngestionPayload } from './knowledgeIngestionTypes'
import { classifyIngestionPayload, buildIngestionPayload } from './knowledgeIngestionClassifier'

export interface StructuredImportRow {
  title: string
  summary: string
  body: string | null
  sourceUrl: string | null
  sourceAuthor: string | null
  sourceYear: string | null
  domain: string | null
  sourceType: string | null
  tags: string | null
}

export interface StructuredImportResult {
  totalRows: number
  validRows: number
  invalidRows: number
  payloads: IngestionPayload[]
  errors: Array<{ rowIndex: number; errors: string[] }>
  warnings: Array<{ rowIndex: number; warnings: string[] }>
  requiresReview: true
  neverAutoPromotes: true
}

const VALID_DOMAINS = new Set<KnowledgeDomain>([
  'technical', 'tactical', 'physical', 'mental', 'competition',
  'nutrition', 'recovery', 'coaching_methodology', 'player_development',
  'parent_education', 'sports_science',
])

const VALID_SOURCE_TYPES = new Set<KnowledgeSourceType>([
  'research_paper', 'coaching_manual', 'itf_guideline', 'usta_resource',
  'academy_internal', 'coach_submission', 'director_submission', 'platform_curated',
])

function parseDomain(value: string | null): KnowledgeDomain | null {
  if (value === null) return null
  const normalized = value.trim().toLowerCase() as KnowledgeDomain
  return VALID_DOMAINS.has(normalized) ? normalized : null
}

function parseSourceType(value: string | null): KnowledgeSourceType | null {
  if (value === null) return null
  const normalized = value.trim().toLowerCase() as KnowledgeSourceType
  return VALID_SOURCE_TYPES.has(normalized) ? normalized : null
}

function parseYear(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const parsed = parseInt(value.trim(), 10)
  if (isNaN(parsed) || parsed < 1900 || parsed > 2100) return null
  return parsed
}

export function processStructuredImport(
  rows: StructuredImportRow[],
  submittedBy: string,
  submittedByRole: IngestionPayload['submittedByRole'],
  academyId: string,
): StructuredImportResult {
  const payloads: IngestionPayload[] = []
  const errors: Array<{ rowIndex: number; errors: string[] }> = []
  const warnings: Array<{ rowIndex: number; warnings: string[] }> = []
  let validRows = 0
  let invalidRows = 0

  rows.forEach((row, index) => {
    const payload = buildIngestionPayload(
      row.title,
      row.summary,
      row.body,
      row.sourceUrl,
      row.sourceAuthor,
      parseYear(row.sourceYear),
      submittedBy,
      submittedByRole,
      academyId,
      'structured_import',
    )

    const domainFromRow = parseDomain(row.domain)
    const sourceTypeFromRow = parseSourceType(row.sourceType)

    if (domainFromRow !== null) payload.inferredDomain = domainFromRow
    if (sourceTypeFromRow !== null) payload.inferredSourceType = sourceTypeFromRow

    if (row.tags !== null && row.tags.trim().length > 0) {
      payload.suggestedTags = row.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    }

    const validation = classifyIngestionPayload(payload)

    if (!validation.isValid) {
      invalidRows += 1
      errors.push({ rowIndex: index, errors: validation.errors })
      payload.status = 'failed_validation'
      payload.validationErrors = validation.errors
    } else {
      validRows += 1
      payload.status = 'queued_for_review'
    }

    if (validation.warnings.length > 0) {
      warnings.push({ rowIndex: index, warnings: validation.warnings })
    }

    payloads.push(payload)
  })

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    payloads,
    errors,
    warnings,
    requiresReview: true,
    neverAutoPromotes: true,
  }
}

export function getImportSummaryLine(result: StructuredImportResult): string {
  const parts: string[] = []
  parts.push(`${result.totalRows} rows processed`)
  parts.push(`${result.validRows} queued for review`)
  if (result.invalidRows > 0) parts.push(`${result.invalidRows} failed validation`)
  return parts.join(' · ')
}
