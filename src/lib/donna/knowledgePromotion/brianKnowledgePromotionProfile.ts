// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 7 — Brian Knowledge Promotion Profile
//
// Tracks all knowledge that originates from Brian Dabul's direct teaching
// and has been promoted to the approved knowledge registry.
//
// Brian Promoted Knowledge Influence Score (BPKIS):
//   How much of DONNA's current promoted knowledge came from Brian.
//   Formula: (brian_active_entries / all_active_entries) * 100,
//   weighted by promotionScore.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Reads from the registry — does not maintain separate state.
//   - Brian entries are identified by scope === 'brian_philosophy_knowledge'
//     OR sourceLearningEntryId links to a brian_direct LearningEntry.

import type { ApprovedKnowledgeEntry } from './donnaApprovedKnowledgeRegistry'
import type { LearningEntry } from '../learning/learningEntryModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'
import type { KnowledgeTargetScope } from './knowledgePromotionCandidateModel'

// ── Profile types ─────────────────────────────────────────────────────────────

export interface BrianKnowledgeEntry {
  registryId: string
  title: string
  scope: KnowledgeTargetScope
  concepts: AcademyOSConcept[]
  promotionScore: number
  approvedAt: string
  reuseCount: number
  topicDomain: string
}

export interface BrianKnowledgePromotionProfile {
  totalPromotedEntries: number
  activeEntries: number
  brianPhilosophyEntries: BrianKnowledgeEntry[]
  promotedConcepts: Array<{ concept: AcademyOSConcept; count: number }>
  brianTerminology: string[]           // unique phrases from Brian knowledge bodies
  topDomains: Array<{ domain: string; count: number }>
  brianPromotedKnowledgeInfluenceScore: number   // 0–100
  avgPromotionScore: number
  totalReuseCount: number
  mostReusedEntry: BrianKnowledgeEntry | null
}

// ── BPKIS computation ─────────────────────────────────────────────────────────

function computeBPKIS(
  brianEntries: ApprovedKnowledgeEntry[],
  allActive: ApprovedKnowledgeEntry[],
): number {
  if (allActive.length === 0) return 0
  if (brianEntries.length === 0) return 0

  const brianScoreSum = brianEntries.reduce((s, e) => s + e.promotionScore, 0)
  const totalScoreSum = allActive.reduce((s, e) => s + e.promotionScore, 0)

  if (totalScoreSum === 0) return 0

  const countWeight = brianEntries.length / allActive.length
  const scoreWeight = brianScoreSum / totalScoreSum
  return Math.round((countWeight * 0.5 + scoreWeight * 0.5) * 100)
}

// ── Terminology extractor ─────────────────────────────────────────────────────

function extractTerminology(entries: ApprovedKnowledgeEntry[]): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'this', 'that', 'and', 'or',
    'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'he', 'she',
    'they', 'we', 'it', 'be', 'been', 'have', 'has', 'had', 'not',
    'academy', 'player', 'players', 'coach', 'session', 'this', 'draft',
    'director', 'requires', 'review', 'approval', 'before', 'official',
    'knowledge', 'source', 'evidence', 'confidence',
  ])

  const wordFreq = new Map<string, number>()
  for (const e of entries) {
    const words = e.body.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
    for (const w of words) {
      if (w.length >= 5 && !stopWords.has(w)) {
        wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1)
      }
    }
  }

  return Array.from(wordFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
}

// ── Main profile builder ──────────────────────────────────────────────────────

/**
 * Build Brian's knowledge promotion profile from the approved knowledge registry.
 *
 * Brian entries are: scope === 'brian_philosophy_knowledge'
 * OR the source LearningEntry had sourceType === 'brian_direct'.
 *
 * Pass all active registry entries + optional learningEntries for source lookup.
 */
export function buildBrianKnowledgePromotionProfile(
  allActiveEntries: ApprovedKnowledgeEntry[],
  learningEntries: LearningEntry[] = [],
): BrianKnowledgePromotionProfile {
  // Build lookup for learning entries by ID
  const learningMap = new Map<string, LearningEntry>()
  for (const le of learningEntries) {
    learningMap.set(le.id, le)
  }

  // Brian entries: philosophy scope OR brian_direct source
  const brianEntries = allActiveEntries.filter(e => {
    if (e.scope === 'brian_philosophy_knowledge') return true
    const source = learningMap.get(e.sourceLearningEntryId)
    return source?.sourceType === 'brian_direct'
  })

  if (brianEntries.length === 0) {
    return {
      totalPromotedEntries: 0,
      activeEntries: 0,
      brianPhilosophyEntries: [],
      promotedConcepts: [],
      brianTerminology: [],
      topDomains: [],
      brianPromotedKnowledgeInfluenceScore: 0,
      avgPromotionScore: 0,
      totalReuseCount: 0,
      mostReusedEntry: null,
    }
  }

  const brianKnowledgeEntries: BrianKnowledgeEntry[] = brianEntries.map(e => ({
    registryId: e.id,
    title: e.title,
    scope: e.scope,
    concepts: e.concepts,
    promotionScore: e.promotionScore,
    approvedAt: e.approvedAt,
    reuseCount: e.reuseCount,
    topicDomain: e.topicDomain,
  }))

  // Concept frequency
  const conceptMap = new Map<AcademyOSConcept, number>()
  for (const e of brianEntries) {
    for (const c of e.concepts) {
      conceptMap.set(c, (conceptMap.get(c) ?? 0) + 1)
    }
  }
  const promotedConcepts = Array.from(conceptMap.entries())
    .map(([concept, count]) => ({ concept, count }))
    .sort((a, b) => b.count - a.count)

  // Domain frequency
  const domainMap = new Map<string, number>()
  for (const e of brianEntries) {
    domainMap.set(e.topicDomain, (domainMap.get(e.topicDomain) ?? 0) + 1)
  }
  const topDomains = Array.from(domainMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)

  const avgPromotionScore = Math.round(
    brianEntries.reduce((s, e) => s + e.promotionScore, 0) / brianEntries.length,
  )

  const totalReuseCount = brianEntries.reduce((s, e) => s + e.reuseCount, 0)

  const sortedByReuse = [...brianKnowledgeEntries].sort((a, b) => b.reuseCount - a.reuseCount)
  const mostReusedEntry = sortedByReuse[0] ?? null

  const bpkis = computeBPKIS(brianEntries, allActiveEntries)

  return {
    totalPromotedEntries: brianEntries.length,
    activeEntries: brianEntries.filter(e => e.status === 'active').length,
    brianPhilosophyEntries: brianKnowledgeEntries,
    promotedConcepts,
    brianTerminology: extractTerminology(brianEntries),
    topDomains,
    brianPromotedKnowledgeInfluenceScore: bpkis,
    avgPromotionScore,
    totalReuseCount,
    mostReusedEntry,
  }
}
