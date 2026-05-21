// Sprint 540 — Knowledge Voice Ingestion
// Handles coach/director voice submissions to the knowledge library.
// Voice → Ingestion payload → pending_review → platform owner/director review.
// Voice NEVER auto-promotes knowledge to curriculum.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { IngestionPayload } from './knowledgeIngestionTypes'
import { buildIngestionPayload, classifyIngestionPayload } from './knowledgeIngestionClassifier'

export type VoiceKnowledgeSubmissionRole = 'coach' | 'head_coach' | 'academy_director'

export interface VoiceKnowledgeSubmissionInput {
  transcript: string
  submittedBy: string
  submittedByRole: VoiceKnowledgeSubmissionRole
  academyId: string
  sourceUrl: string | null
  sourceAuthor: string | null
  sourceYear: number | null
}

export interface VoiceKnowledgeSubmissionResult {
  ingestionId: string
  payload: IngestionPayload
  extractedTitle: string
  extractedSummary: string
  isValid: boolean
  validationErrors: string[]
  warnings: string[]
  requiresReview: true
  neverAutoPromotes: true
  status: 'queued_for_review' | 'failed_validation'
}

function extractTitleFromTranscript(transcript: string): string {
  const sentences = transcript.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0)
  if (sentences.length === 0) return transcript.slice(0, 80).trim()

  const firstSentence = sentences[0]
  if (firstSentence.length <= 100) return firstSentence

  const words = firstSentence.split(/\s+/)
  return words.slice(0, 12).join(' ')
}

function extractSummaryFromTranscript(transcript: string): string {
  const trimmed = transcript.trim()
  if (trimmed.length <= 300) return trimmed

  const sentences = trimmed.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0)
  let summary = ''
  for (const sentence of sentences) {
    if ((summary + sentence).length > 300) break
    summary += (summary ? ' ' : '') + sentence + '.'
  }
  return summary || trimmed.slice(0, 300)
}

export function processVoiceKnowledgeSubmission(
  input: VoiceKnowledgeSubmissionInput,
): VoiceKnowledgeSubmissionResult {
  const extractedTitle = extractTitleFromTranscript(input.transcript)
  const extractedSummary = extractSummaryFromTranscript(input.transcript)

  const roleMap: Record<VoiceKnowledgeSubmissionRole, IngestionPayload['submittedByRole']> = {
    coach: 'coach',
    head_coach: 'head_coach',
    academy_director: 'academy_director',
  }

  const sourceTypeMap: Record<VoiceKnowledgeSubmissionRole, IngestionPayload['method']> = {
    coach: 'coach_voice_submission',
    head_coach: 'coach_voice_submission',
    academy_director: 'director_voice_submission',
  }

  const payload = buildIngestionPayload(
    extractedTitle,
    extractedSummary,
    input.transcript.length > 300 ? input.transcript : null,
    input.sourceUrl,
    input.sourceAuthor,
    input.sourceYear,
    input.submittedBy,
    roleMap[input.submittedByRole],
    input.academyId,
    sourceTypeMap[input.submittedByRole],
  )

  const validation = classifyIngestionPayload(payload)

  return {
    ingestionId: payload.ingestionId,
    payload: {
      ...payload,
      inferredDomain: validation.autoInferredDomain ?? payload.inferredDomain,
      inferredSourceType: validation.autoInferredSourceType ?? payload.inferredSourceType,
      status: validation.isValid ? 'queued_for_review' : 'failed_validation',
      validationErrors: validation.errors,
    },
    extractedTitle,
    extractedSummary,
    isValid: validation.isValid,
    validationErrors: validation.errors,
    warnings: validation.warnings,
    requiresReview: true,
    neverAutoPromotes: true,
    status: validation.isValid ? 'queued_for_review' : 'failed_validation',
  }
}
