// Sprint 539 — Knowledge Ingestion Classifier
// Deterministic classifier for inbound knowledge submissions.
// Infers domain, source type, and tags from text — no AI API calls.
// All classifications produce pending_review items only.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeDomain, KnowledgeSourceType } from './knowledgeTypes'
import type { IngestionPayload, IngestionValidationResult, IngestionStatus } from './knowledgeIngestionTypes'
import { INGESTION_CONTENT_SAFETY_PATTERNS } from './knowledgeIngestionTypes'

const DOMAIN_KEYWORD_MAP: Record<string, KnowledgeDomain> = {
  forehand: 'technical', backhand: 'technical', serve: 'technical',
  volley: 'technical', technique: 'technical', stroke: 'technical',
  grip: 'technical', contact: 'technical', swing: 'technical',
  tactic: 'tactical', tactical: 'tactical', strategy: 'tactical',
  pattern: 'tactical', positioning: 'tactical', point: 'tactical',
  fitness: 'physical', agility: 'physical', speed: 'physical',
  strength: 'physical', endurance: 'physical', athletic: 'physical',
  movement: 'physical', footwork: 'physical', coordination: 'physical',
  mental: 'mental', focus: 'mental', confidence: 'mental', mindset: 'mental',
  pressure: 'mental', resilience: 'mental', emotion: 'mental',
  competition: 'competition', match: 'competition', tournament: 'competition',
  ranking: 'competition', draw: 'competition',
  nutrition: 'nutrition', diet: 'nutrition', hydration: 'nutrition',
  protein: 'nutrition', carbohydrate: 'nutrition',
  recovery: 'recovery', sleep: 'recovery', rest: 'recovery', fatigue: 'recovery',
  'injury prevention': 'recovery', rehabilitation: 'recovery',
  coaching: 'coaching_methodology', pedagogy: 'coaching_methodology',
  'player development': 'player_development', pathway: 'player_development',
  assessment: 'player_development', evaluation: 'player_development',
  parent: 'parent_education', family: 'parent_education',
  'sports science': 'sports_science', physiology: 'sports_science',
  biomechanics: 'sports_science', psychology: 'sports_science',
}

const SOURCE_TYPE_KEYWORD_MAP: Record<string, KnowledgeSourceType> = {
  itf: 'itf_guideline', 'international tennis federation': 'itf_guideline',
  usta: 'usta_resource', 'united states tennis association': 'usta_resource',
  research: 'research_paper', journal: 'research_paper', study: 'research_paper',
  'peer reviewed': 'research_paper', doi: 'research_paper',
  manual: 'coaching_manual', handbook: 'coaching_manual', guide: 'coaching_manual',
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 1)
}

function inferDomain(text: string): KnowledgeDomain | null {
  const lower = text.toLowerCase()
  const tokens = tokenize(text)
  for (const [keyword, domain] of Object.entries(DOMAIN_KEYWORD_MAP)) {
    if (keyword.includes(' ')) {
      if (lower.includes(keyword)) return domain
    } else {
      if (tokens.includes(keyword)) return domain
    }
  }
  return null
}

function inferSourceType(text: string): KnowledgeSourceType | null {
  const lower = text.toLowerCase()
  for (const [keyword, sourceType] of Object.entries(SOURCE_TYPE_KEYWORD_MAP)) {
    if (lower.includes(keyword)) return sourceType
  }
  return null
}

function checkContentSafety(text: string): string[] {
  const lower = text.toLowerCase()
  const flags: string[] = []
  for (const { pattern, flag } of INGESTION_CONTENT_SAFETY_PATTERNS) {
    if (lower.includes(pattern)) flags.push(flag)
  }
  return flags
}

export function classifyIngestionPayload(payload: IngestionPayload): IngestionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (payload.rawTitle.trim().length < 5) {
    errors.push('Title must be at least 5 characters.')
  }

  if (payload.rawSummary.trim().length < 20) {
    errors.push('Summary must be at least 20 characters.')
  }

  if (payload.rawTitle.length > 200) {
    warnings.push('Title is very long — consider shortening.')
  }

  const combinedText = `${payload.rawTitle} ${payload.rawSummary} ${payload.rawBody ?? ''} ${payload.rawSourceUrl ?? ''}`
  const autoInferredDomain = payload.inferredDomain ?? inferDomain(combinedText)
  const autoInferredSourceType = payload.inferredSourceType ?? inferSourceType(
    `${payload.rawSourceUrl ?? ''} ${payload.rawTitle} ${payload.rawSummary}`,
  )

  const safetyFlags = checkContentSafety(combinedText)
  const safetyCheckPassed = safetyFlags.length === 0

  if (!safetyCheckPassed) {
    warnings.push(...safetyFlags)
  }

  if (payload.rawSourceUrl !== null && !payload.rawSourceUrl.startsWith('http')) {
    warnings.push('Source URL does not appear to be a valid URL.')
  }

  return {
    ingestionId: payload.ingestionId,
    isValid: errors.length === 0,
    errors,
    warnings,
    autoInferredDomain,
    autoInferredSourceType,
    safetyCheckPassed,
    safetyFlags,
  }
}

export function buildIngestionPayload(
  rawTitle: string,
  rawSummary: string,
  rawBody: string | null,
  rawSourceUrl: string | null,
  rawSourceAuthor: string | null,
  rawSourceYear: number | null,
  submittedBy: string,
  submittedByRole: IngestionPayload['submittedByRole'],
  academyId: string,
  method: IngestionPayload['method'],
): IngestionPayload {
  const ingestionId = `ing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const combinedText = `${rawTitle} ${rawSummary} ${rawBody ?? ''}`
  const inferredDomain = inferDomain(combinedText)
  const inferredSourceType = inferSourceType(`${rawSourceUrl ?? ''} ${rawTitle}`)

  return {
    ingestionId,
    method,
    submittedBy,
    submittedByRole,
    academyId,
    rawTitle,
    rawSummary,
    rawBody,
    rawSourceUrl,
    rawSourceAuthor,
    rawSourceYear,
    inferredDomain,
    inferredSourceType,
    suggestedTags: [],
    status: 'submitted' as IngestionStatus,
    validationErrors: [],
    submittedAt: new Date().toISOString(),
  }
}
