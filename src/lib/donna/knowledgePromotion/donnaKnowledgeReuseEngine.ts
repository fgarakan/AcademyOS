// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 10 — Knowledge Reuse Engine
//
// When DONNA answers questions, approved knowledge can be retrieved and cited.
// This engine retrieves the most relevant active knowledge entries for a given context.
//
// Retrieval rules:
//   1. Active entries ONLY (status === 'active')
//   2. Academy-specific knowledge before global candidates
//   3. Brian-approved knowledge (brian_philosophy_knowledge) cited as "Academy Philosophy"
//   4. Rejected/archived entries are NEVER returned
//   5. Results include source trace for transparency
//   6. Recording reuse increments reuseCount in the registry
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Read-only by default — use recordReuse() explicitly to track usage.
//   - Results include confidence signals so DONNA can calibrate certainty.

import type { ApprovedKnowledgeEntry } from './donnaApprovedKnowledgeRegistry'
import { donnaApprovedKnowledgeRegistry } from './donnaApprovedKnowledgeRegistry'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'
import type { LearningTopicDomain } from '../learning/learningEntryModel'
import type { KnowledgeTargetScope } from './knowledgePromotionCandidateModel'

// ── Retrieval request ─────────────────────────────────────────────────────────

export interface KnowledgeReuseRequest {
  academyId: string
  concepts?: AcademyOSConcept[]        // concepts to match
  topicDomain?: LearningTopicDomain    // optional domain filter
  keywords?: string[]                  // free-text keyword matching
  maxResults?: number                  // default: 5
  includeGlobal?: boolean              // whether to include global_platform_knowledge_candidate
  preferBrianPhilosophy?: boolean      // whether to float brian_philosophy_knowledge first
}

// ── Reuse result ──────────────────────────────────────────────────────────────

export interface KnowledgeReuseItem {
  entry: ApprovedKnowledgeEntry
  relevanceScore: number               // 0–100 match score
  scopeLabel: string
  sourceTrace: KnowledgeSourceTrace
  isBrianPhilosophy: boolean
  isAcademySpecific: boolean
}

export interface KnowledgeSourceTrace {
  sourceLearningEntryId: string
  sourceSummary: string
  sourceEvidence: string[]
  approvedBy: string
  approvedAt: string
  promotedBy: string
  promotedAt: string
  sourceReliability: number
}

export interface KnowledgeReuseResult {
  items: KnowledgeReuseItem[]
  totalFound: number
  academySpecificCount: number
  brianPhilosophyCount: number
  globalCount: number
  topResult: KnowledgeReuseItem | null
  usedKnowledge: boolean              // whether any items were returned
}

// ── Scope labels ──────────────────────────────────────────────────────────────

const SCOPE_LABELS: Record<KnowledgeTargetScope, string> = {
  academy_specific_knowledge:           'Academy Knowledge',
  global_platform_knowledge_candidate:  'Platform Knowledge',
  brian_philosophy_knowledge:           'Academy Philosophy',
  curriculum_knowledge:                 'Curriculum Knowledge',
  coach_standard_knowledge:             'Coaching Standard',
  parent_communication_knowledge:       'Parent Communication Standard',
  operating_model_knowledge:            'Academy Operating Knowledge',
}

// ── Scope priority (lower = higher priority) ──────────────────────────────────

const SCOPE_PRIORITY: Record<KnowledgeTargetScope, number> = {
  brian_philosophy_knowledge:           0,
  academy_specific_knowledge:           1,
  curriculum_knowledge:                 2,
  coach_standard_knowledge:             3,
  parent_communication_knowledge:       4,
  operating_model_knowledge:            5,
  global_platform_knowledge_candidate:  6,
}

// ── Relevance scorer ──────────────────────────────────────────────────────────

function scoreRelevance(
  entry: ApprovedKnowledgeEntry,
  request: KnowledgeReuseRequest,
): number {
  let score = 0

  // Concept match (40 points)
  if (request.concepts && request.concepts.length > 0) {
    const overlap = entry.concepts.filter(c => request.concepts!.includes(c)).length
    const maxPossible = Math.min(request.concepts.length, entry.concepts.length)
    if (maxPossible > 0) {
      score += (overlap / maxPossible) * 40
    }
  }

  // Domain match (25 points)
  if (request.topicDomain && entry.topicDomain === request.topicDomain) {
    score += 25
  }

  // Keyword match (20 points)
  if (request.keywords && request.keywords.length > 0) {
    const bodyLower = (entry.title + ' ' + entry.body).toLowerCase()
    const matched = request.keywords.filter(kw => bodyLower.includes(kw.toLowerCase())).length
    score += (matched / request.keywords.length) * 20
  }

  // Reliability bonus (15 points)
  score += entry.sourceReliability * 15

  return Math.round(Math.min(score, 100))
}

// ── Main retrieval ────────────────────────────────────────────────────────────

/**
 * Retrieve relevant approved knowledge for a DONNA response context.
 * Returns only active entries. Excludes rejected/archived.
 */
export function retrieveKnowledge(request: KnowledgeReuseRequest): KnowledgeReuseResult {
  const maxResults = request.maxResults ?? 5
  let candidates = donnaApprovedKnowledgeRegistry.getByAcademy(request.academyId)

  // Also include global knowledge if requested
  if (request.includeGlobal) {
    const global = donnaApprovedKnowledgeRegistry.getByScope('global_platform_knowledge_candidate')
      .filter(e => !candidates.some(c => c.id === e.id))
    candidates = [...candidates, ...global]
  }

  // Filter: active only; exclude global scope when includeGlobal is false
  const active = candidates.filter(e => {
    if (e.status !== 'active') return false
    if (!request.includeGlobal && e.scope === 'global_platform_knowledge_candidate') return false
    return true
  })

  if (active.length === 0) {
    return {
      items: [],
      totalFound: 0,
      academySpecificCount: 0,
      brianPhilosophyCount: 0,
      globalCount: 0,
      topResult: null,
      usedKnowledge: false,
    }
  }

  // Score each entry
  const scored: KnowledgeReuseItem[] = active.map(entry => ({
    entry,
    relevanceScore: scoreRelevance(entry, request),
    scopeLabel: SCOPE_LABELS[entry.scope],
    sourceTrace: {
      sourceLearningEntryId: entry.sourceLearningEntryId,
      sourceSummary: entry.sourceSummary,
      sourceEvidence: entry.sourceEvidence,
      approvedBy: entry.approvedBy,
      approvedAt: entry.approvedAt,
      promotedBy: entry.promotedBy,
      promotedAt: entry.promotedAt,
      sourceReliability: entry.sourceReliability,
    },
    isBrianPhilosophy: entry.scope === 'brian_philosophy_knowledge',
    isAcademySpecific: entry.scope === 'academy_specific_knowledge',
  }))

  // Filter out zero-relevance items (no match at all) unless no concepts/domain given
  const hasFilter = (request.concepts?.length ?? 0) > 0 || !!request.topicDomain || (request.keywords?.length ?? 0) > 0
  const relevant = hasFilter
    ? scored.filter(i => i.relevanceScore > 0)
    : scored

  // Sort: relevance DESC, then scope priority, then promotion score
  relevant.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
    const prioA = SCOPE_PRIORITY[a.entry.scope]
    const prioB = SCOPE_PRIORITY[b.entry.scope]
    if (prioA !== prioB) return prioA - prioB
    return b.entry.promotionScore - a.entry.promotionScore
  })

  // Brian philosophy float
  if (request.preferBrianPhilosophy) {
    const brianItems = relevant.filter(i => i.isBrianPhilosophy)
    const others = relevant.filter(i => !i.isBrianPhilosophy)
    relevant.splice(0, relevant.length, ...brianItems, ...others)
  }

  const limited = relevant.slice(0, maxResults)

  return {
    items: limited,
    totalFound: limited.length,
    academySpecificCount: limited.filter(i => i.isAcademySpecific).length,
    brianPhilosophyCount: limited.filter(i => i.isBrianPhilosophy).length,
    globalCount: limited.filter(i => i.entry.scope === 'global_platform_knowledge_candidate').length,
    topResult: limited[0] ?? null,
    usedKnowledge: limited.length > 0,
  }
}

/**
 * Record that knowledge was used in a DONNA response.
 * Call this after a retrieveKnowledge() result is actually used.
 */
export function recordKnowledgeReuse(entryIds: string[]): void {
  for (const id of entryIds) {
    donnaApprovedKnowledgeRegistry.recordReuse(id)
  }
}
