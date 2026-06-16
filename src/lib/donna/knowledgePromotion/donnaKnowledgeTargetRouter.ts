// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 6 — Knowledge Target Router
//
// Routes a promoted KnowledgePromotionCandidate to the correct ApprovedKnowledgeEntry
// in the registry. Handles the final write step after director approval.
//
// The router:
//   1. Validates the candidate is in 'approved' status
//   2. Checks for existing knowledge on the same topic (potential supersede)
//   3. Writes to the ApprovedKnowledgeRegistry with correct scope and traceability
//   4. Returns a promotion receipt with full trace
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Always traces back to source LearningEntry and Candidate.
//   - Never overwrites without a supersede record.

import type { KnowledgePromotionCandidate } from './knowledgePromotionCandidateModel'
import type { ApprovedKnowledgeEntry } from './donnaApprovedKnowledgeRegistry'
import { donnaApprovedKnowledgeRegistry } from './donnaApprovedKnowledgeRegistry'
import type { LearningEntry } from '../learning/learningEntryModel'

// ── Promotion receipt ─────────────────────────────────────────────────────────

export interface PromotionReceipt {
  success: boolean
  registryEntryId: string | null
  candidateId: string
  learningEntryId: string
  action: 'created' | 'superseded' | 'blocked'
  supersededEntryId: string | null
  promotedBy: string
  promotedAt: string
  scope: string
  blockedReason: string | null
  traceability: PromotionTraceability
}

export interface PromotionTraceability {
  sourceLearningEntryId: string
  sourceSummary: string
  sourceEvidence: string[]
  sourceReliability: number
  approvedBy: string
  approvedAt: string
  promotedBy: string
  promotedAt: string
  candidateId: string
  promotionScore: number
}

// ── Similarity check ──────────────────────────────────────────────────────────

function findExistingKnowledge(
  candidate: KnowledgePromotionCandidate,
): ApprovedKnowledgeEntry | null {
  const existing = donnaApprovedKnowledgeRegistry.getByAcademy(candidate.academyId)

  for (const entry of existing) {
    // Same source learning entry — clear supersede case
    if (entry.sourceLearningEntryId === candidate.learningEntryId) return entry

    // Same topic domain + overlapping concepts — potential supersede
    if (
      entry.topicDomain === candidate.topicDomain &&
      candidate.concepts.some(c => entry.concepts.includes(c)) &&
      entry.scope === candidate.targetScope
    ) {
      return entry
    }
  }

  return null
}

// ── Main router ───────────────────────────────────────────────────────────────

/**
 * Route an approved candidate to the knowledge registry.
 * Candidate must be in 'approved' status.
 *
 * @param candidate - The approved promotion candidate
 * @param sourceEntry - The original LearningEntry (for traceability)
 * @param promotedBy - Name of the person executing the promotion
 */
export function routeToKnowledgeRegistry(
  candidate: KnowledgePromotionCandidate,
  sourceEntry: LearningEntry,
  promotedBy: string,
): PromotionReceipt {
  const now = new Date().toISOString()

  const traceability: PromotionTraceability = {
    sourceLearningEntryId: sourceEntry.id,
    sourceSummary: sourceEntry.summary,
    sourceEvidence: [sourceEntry.evidence, ...sourceEntry.examplePhrases].filter(Boolean),
    sourceReliability: sourceEntry.sourceReliability,
    approvedBy: candidate.approvedBy ?? promotedBy,
    approvedAt: candidate.approvedAt ?? now,
    promotedBy,
    promotedAt: now,
    candidateId: candidate.id,
    promotionScore: candidate.promotionScore,
  }

  // Gate: candidate must be approved
  if (candidate.status !== 'approved') {
    return {
      success: false,
      registryEntryId: null,
      candidateId: candidate.id,
      learningEntryId: candidate.learningEntryId,
      action: 'blocked',
      supersededEntryId: null,
      promotedBy,
      promotedAt: now,
      scope: candidate.targetScope,
      blockedReason: `Candidate status is "${candidate.status}" — must be "approved" to promote`,
      traceability,
    }
  }

  const entryParams: Omit<ApprovedKnowledgeEntry, 'id' | 'reuseCount' | 'lastUsedAt' | 'version' | 'previousVersionId' | 'status'> = {
    academyId: candidate.academyId,
    scope: candidate.targetScope,
    title: candidate.proposedTitle,
    body: candidate.proposedBody,
    concepts: candidate.concepts,
    topicDomain: candidate.topicDomain,
    tags: [],
    sourceLearningEntryId: candidate.learningEntryId,
    sourceCandidateId: candidate.id,
    sourceEvidence: candidate.sourceEvidence,
    sourceSummary: candidate.sourceSummary,
    approvedBy: candidate.approvedBy ?? promotedBy,
    approvedAt: candidate.approvedAt ?? now,
    promotedBy,
    promotedAt: now,
    sourceReliability: candidate.sourceReliability,
    promotionScore: candidate.promotionScore,
    metadata: {
      ...candidate.metadata,
      traceability,
    },
  }

  // Check for existing knowledge that might be superseded
  const existing = findExistingKnowledge(candidate)

  if (existing) {
    const newEntry = donnaApprovedKnowledgeRegistry.supersede(existing.id, entryParams, promotedBy)
    if (!newEntry) {
      return {
        success: false,
        registryEntryId: null,
        candidateId: candidate.id,
        learningEntryId: candidate.learningEntryId,
        action: 'blocked',
        supersededEntryId: existing.id,
        promotedBy,
        promotedAt: now,
        scope: candidate.targetScope,
        blockedReason: 'Supersede operation failed — existing entry not found in registry',
        traceability,
      }
    }
    return {
      success: true,
      registryEntryId: newEntry.id,
      candidateId: candidate.id,
      learningEntryId: candidate.learningEntryId,
      action: 'superseded',
      supersededEntryId: existing.id,
      promotedBy,
      promotedAt: now,
      scope: candidate.targetScope,
      blockedReason: null,
      traceability,
    }
  }

  // No existing — create fresh
  const newEntry = donnaApprovedKnowledgeRegistry.promote(entryParams, promotedBy)
  return {
    success: true,
    registryEntryId: newEntry.id,
    candidateId: candidate.id,
    learningEntryId: candidate.learningEntryId,
    action: 'created',
    supersededEntryId: null,
    promotedBy,
    promotedAt: now,
    scope: candidate.targetScope,
    blockedReason: null,
    traceability,
  }
}
