// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 4 — Learning Cluster Engine
//
// Detects repeated learning and groups entries into named clusters.
// A cluster represents an emerging pattern — the same concern appearing
// across multiple conversations, sessions, or actors.
//
// Example:
//   Brian says "Players struggle with transition footwork" three times.
//   Cluster: "Transition Footwork Difficulty" — frequency 3, trending up.
//
// Clustering strategy:
//   1. Exact concept overlap — entries sharing ≥ 2 AcademyOS concepts
//   2. Topic similarity — entries sharing the same topic domain + keywords
//   3. Summary keyword overlap — significant shared vocabulary
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Clusters are rebuilt deterministically from entries — no stored cluster state.
//   - Returns a ClusterReport the caller can store in the Ledger.

import type { LearningEntry } from './learningEntryModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'

// ── Cluster types ─────────────────────────────────────────────────────────────

export interface LearningCluster {
  id: string
  label: string                       // human-readable cluster name
  topicDomain: string
  dominantConcepts: AcademyOSConcept[]
  entryIds: string[]
  frequency: number                   // entry count
  firstSeenAt: string                 // ISO timestamp of earliest entry
  lastSeenAt: string                  // ISO timestamp of most recent entry
  trend: 'growing' | 'stable' | 'declining'
  avgScore: number
  isEmergingPattern: boolean          // frequency ≥ 3 and growing
  keyPhrases: string[]                // representative phrases from entries
}

export interface ClusterReport {
  clusters: LearningCluster[]
  unclustered: string[]               // entry IDs that did not fit a cluster
  clusterCount: number
  emergingPatterns: LearningCluster[]
  topCluster: LearningCluster | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function conceptOverlap(a: AcademyOSConcept[], b: AcademyOSConcept[]): number {
  return a.filter(c => b.includes(c)).length
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'we', 'they',
    'it', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'this', 'that', 'these', 'those', 'my', 'our', 'their',
    'he', 'she', 'him', 'her', 'his', 'not', 'no', 'do', 'does',
    'very', 'just', 'have', 'has', 'had', 'be', 'been', 'get', 'got',
  ])
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w))
}

function keywordOverlap(a: string, b: string): number {
  const wordsA = new Set(extractKeywords(a))
  const wordsB = new Set(extractKeywords(b))
  return Array.from(wordsA).filter(w => wordsB.has(w)).length
}

function isSimilarEntry(a: LearningEntry, b: LearningEntry): boolean {
  // Same domain + 2+ shared concepts
  if (a.topicDomain === b.topicDomain && conceptOverlap(a.concepts, b.concepts) >= 2) return true
  // Same top concept + keyword overlap
  if (a.concepts[0] && a.concepts[0] === b.concepts[0] && keywordOverlap(a.summary, b.summary) >= 2) return true
  // Topic label similarity
  if (a.topic.toLowerCase() === b.topic.toLowerCase()) return true
  return false
}

function determineTrend(entries: LearningEntry[]): LearningCluster['trend'] {
  if (entries.length < 2) return 'stable'
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const midpoint = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, midpoint)
  const secondHalf = sorted.slice(midpoint)
  if (secondHalf.length > firstHalf.length + 1) return 'growing'
  if (firstHalf.length > secondHalf.length + 1) return 'declining'
  return 'stable'
}

function buildClusterLabel(entries: LearningEntry[]): string {
  // Use most common topic as label
  const topicCounts = new Map<string, number>()
  for (const e of entries) {
    topicCounts.set(e.topic, (topicCounts.get(e.topic) ?? 0) + 1)
  }
  const mostCommon = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]
  return mostCommon ? mostCommon[0] : entries[0]?.topic ?? 'Unknown Cluster'
}

let _clusterCounter = 0
function generateClusterId(): string {
  _clusterCounter += 1
  return `cluster-${Date.now()}-${_clusterCounter}`
}

// ── Main engine ───────────────────────────────────────────────────────────────

/**
 * Cluster a set of learning entries.
 * Returns a ClusterReport with named clusters and unclustered entries.
 */
export function clusterLearningEntries(entries: LearningEntry[]): ClusterReport {
  if (entries.length === 0) {
    return { clusters: [], unclustered: [], clusterCount: 0, emergingPatterns: [], topCluster: null }
  }

  // Union-find style grouping
  const grouped: LearningEntry[][] = []
  const assigned = new Set<string>()

  for (const entry of entries) {
    if (assigned.has(entry.id)) continue

    // Find all similar entries
    const group: LearningEntry[] = [entry]
    assigned.add(entry.id)

    for (const other of entries) {
      if (assigned.has(other.id)) continue
      if (isSimilarEntry(entry, other)) {
        group.push(other)
        assigned.add(other.id)
      }
    }

    grouped.push(group)
  }

  // Build clusters from groups with ≥ 2 entries
  const clusters: LearningCluster[] = []
  const unclustered: string[] = []

  for (const group of grouped) {
    if (group.length < 2) {
      unclustered.push(...group.map(e => e.id))
      continue
    }

    const sorted = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    // Aggregate dominant concepts (most frequent across group)
    const conceptMap = new Map<AcademyOSConcept, number>()
    for (const e of group) {
      for (const c of e.concepts) {
        conceptMap.set(c, (conceptMap.get(c) ?? 0) + 1)
      }
    }
    const dominantConcepts = Array.from(conceptMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c)

    const keyPhrases = group
      .flatMap(e => e.examplePhrases)
      .slice(0, 5)

    const avgScore = Math.round(
      group.reduce((sum, e) => sum + e.learningScore, 0) / group.length,
    )

    const trend = determineTrend(group)
    const frequency = group.length

    const cluster: LearningCluster = {
      id: generateClusterId(),
      label: buildClusterLabel(group),
      topicDomain: group[0].topicDomain,
      dominantConcepts,
      entryIds: group.map(e => e.id),
      frequency,
      firstSeenAt: sorted[0].createdAt,
      lastSeenAt: sorted[sorted.length - 1].createdAt,
      trend,
      avgScore,
      isEmergingPattern: frequency >= 3 && trend !== 'declining',
      keyPhrases,
    }

    clusters.push(cluster)
  }

  clusters.sort((a, b) => b.frequency - a.frequency)

  const emergingPatterns = clusters.filter(c => c.isEmergingPattern)
  const topCluster = clusters[0] ?? null

  return {
    clusters,
    unclustered,
    clusterCount: clusters.length,
    emergingPatterns,
    topCluster,
  }
}
