// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 10 — Brian Learning Profile
//
// Tracks all learning that originates from Brian Dabul (academy owner).
// Brian is the highest-trust source (reliability 0.95) and the primary teacher.
//
// Brian Influence Score:
//   A 0–100 composite that measures how much of DONNA's current approved
//   knowledge originated from Brian's direct teaching.
//
// Formula:
//   BIS = (brian_approved_count / total_approved_count) * 100
//   Weighted by score: high-score Brian entries count more.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Brian is identified by sourceType === 'brian_direct'.
//   - All entry references are from the ledger; this module only reads.

import type { LearningEntry } from './learningEntryModel'

// ── Profile types ─────────────────────────────────────────────────────────────

export interface BrianLearningProfile {
  totalEntries: number
  approvedEntries: number
  promotedEntries: number
  pendingEntries: number
  rejectedEntries: number
  avgScore: number
  avgConfidence: number
  topTopics: Array<{ topic: string; count: number; avgScore: number }>
  brianInfluenceScore: number           // 0–100
  mostRecentEntryAt: string | null
  totalEvidencePhrases: number
  domains: Record<string, number>       // topicDomain → count
}

// ── Brian Influence Score ─────────────────────────────────────────────────────

function computeBIS(brianEntries: LearningEntry[], allApprovedEntries: LearningEntry[]): number {
  if (allApprovedEntries.length === 0) return 0

  const brianApproved = brianEntries.filter(
    e => e.status === 'approved' || e.status === 'promoted',
  )
  if (brianApproved.length === 0) return 0

  // Weight by score
  const brianWeightedScore = brianApproved.reduce((sum, e) => sum + e.learningScore, 0)
  const totalWeightedScore = allApprovedEntries.reduce((sum, e) => sum + e.learningScore, 0)

  if (totalWeightedScore === 0) return 0

  const countWeight = brianApproved.length / allApprovedEntries.length
  const scoreWeight = brianWeightedScore / totalWeightedScore

  // 60% count, 40% score weighting
  return Math.round((countWeight * 0.6 + scoreWeight * 0.4) * 100)
}

// ── Main profile builder ──────────────────────────────────────────────────────

/**
 * Build Brian's learning profile from the full ledger entry set.
 */
export function buildBrianLearningProfile(allEntries: LearningEntry[]): BrianLearningProfile {
  const brianEntries = allEntries.filter(e => e.sourceType === 'brian_direct')

  if (brianEntries.length === 0) {
    return {
      totalEntries: 0,
      approvedEntries: 0,
      promotedEntries: 0,
      pendingEntries: 0,
      rejectedEntries: 0,
      avgScore: 0,
      avgConfidence: 0,
      topTopics: [],
      brianInfluenceScore: 0,
      mostRecentEntryAt: null,
      totalEvidencePhrases: 0,
      domains: {},
    }
  }

  const approved = brianEntries.filter(e => e.status === 'approved')
  const promoted = brianEntries.filter(e => e.status === 'promoted')
  const pending  = brianEntries.filter(e => e.status === 'captured' || e.status === 'reviewing')
  const rejected = brianEntries.filter(e => e.status === 'rejected')

  const avgScore = Math.round(
    brianEntries.reduce((sum, e) => sum + e.learningScore, 0) / brianEntries.length,
  )
  const avgConfidence = Math.round(
    brianEntries.reduce((sum, e) => sum + e.confidence, 0) / brianEntries.length * 100,
  ) / 100

  // Top topics
  const topicMap = new Map<string, { count: number; totalScore: number }>()
  for (const e of brianEntries) {
    const existing = topicMap.get(e.topic) ?? { count: 0, totalScore: 0 }
    topicMap.set(e.topic, {
      count: existing.count + 1,
      totalScore: existing.totalScore + e.learningScore,
    })
  }
  const topTopics = Array.from(topicMap.entries())
    .map(([topic, { count, totalScore }]) => ({
      topic,
      count,
      avgScore: Math.round(totalScore / count),
    }))
    .sort((a, b) => b.count - a.count || b.avgScore - a.avgScore)
    .slice(0, 10)

  // Domains
  const domains: Record<string, number> = {}
  for (const e of brianEntries) {
    domains[e.topicDomain] = (domains[e.topicDomain] ?? 0) + 1
  }

  const sortedByDate = [...brianEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const mostRecentEntryAt = sortedByDate[0]?.createdAt ?? null

  const totalEvidencePhrases = brianEntries.reduce((sum, e) => sum + e.examplePhrases.length, 0)

  const allApproved = allEntries.filter(e => e.status === 'approved' || e.status === 'promoted')
  const brianInfluenceScore = computeBIS(brianEntries, allApproved)

  return {
    totalEntries: brianEntries.length,
    approvedEntries: approved.length,
    promotedEntries: promoted.length,
    pendingEntries: pending.length,
    rejectedEntries: rejected.length,
    avgScore,
    avgConfidence,
    topTopics,
    brianInfluenceScore,
    mostRecentEntryAt,
    totalEvidencePhrases,
    domains,
  }
}
