// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 11 — Learning Insights Engine
//
// Generates high-level insights from the set of approved/promoted learnings.
// Insights are summaries, patterns, and recommended actions for the director.
//
// Insight types:
//   - emerging_pattern:   A concept is appearing with increasing frequency
//   - knowledge_gap:      A domain has fewer than 2 approved learnings
//   - high_value_cluster: A cluster with avg score >= 70 and 3+ entries
//   - stale_review:       Entries in 'captured' status older than 7 days
//   - top_concern:        Most common concept across approved learnings
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Insights are advisory only — never modify ledger state.
//   - All insights include a recommended action.

import type { LearningEntry, LearningTopicDomain } from './learningEntryModel'
import type { LearningCluster } from './donnaLearningClusterEngine'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'

// ── Insight types ─────────────────────────────────────────────────────────────

export type InsightType =
  | 'emerging_pattern'
  | 'knowledge_gap'
  | 'high_value_cluster'
  | 'stale_review'
  | 'top_concern'
  | 'owner_teaching_gap'

export interface LearningInsight {
  id: string
  type: InsightType
  title: string
  detail: string
  recommendedAction: string
  severity: 'info' | 'low' | 'medium' | 'high'
  affectedEntryIds: string[]
  affectedDomain: LearningTopicDomain | null
  affectedConcept: AcademyOSConcept | null
  generatedAt: string
}

export interface InsightReport {
  insights: LearningInsight[]
  totalCount: number
  highSeverityCount: number
  topConcern: AcademyOSConcept | null
  weakestDomain: LearningTopicDomain | null
  summary: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _insightCounter = 0
function insightId(): string {
  _insightCounter += 1
  return `insight-${Date.now()}-${_insightCounter}`
}

const ALL_DOMAINS: LearningTopicDomain[] = [
  'curriculum', 'player_development', 'coaching_philosophy',
  'academy_operations', 'parent_relations', 'player_psychology',
  'competitive_readiness', 'group_management', 'session_execution',
  'enrollment', 'general',
]

// ── Insight generators ────────────────────────────────────────────────────────

function detectEmergingPatterns(
  approvedEntries: LearningEntry[],
): LearningInsight[] {
  const conceptCounts = new Map<AcademyOSConcept, LearningEntry[]>()
  for (const e of approvedEntries) {
    for (const c of e.concepts) {
      const bucket = conceptCounts.get(c) ?? []
      bucket.push(e)
      conceptCounts.set(c, bucket)
    }
  }

  const insights: LearningInsight[] = []
  for (const [concept, entries] of Array.from(conceptCounts.entries())) {
    if (entries.length >= 3) {
      insights.push({
        id: insightId(),
        type: 'emerging_pattern',
        title: `Emerging pattern: ${concept.replace(/_/g, ' ')}`,
        detail: `"${concept.replace(/_/g, ' ')}" has appeared in ${entries.length} approved learnings. This may warrant curriculum or operational review.`,
        recommendedAction: `Review the ${entries.length} entries tagged with "${concept}" and decide if an action plan is needed.`,
        severity: entries.length >= 5 ? 'high' : 'medium',
        affectedEntryIds: entries.map((e: LearningEntry) => e.id),
        affectedDomain: entries[0]?.topicDomain ?? null,
        affectedConcept: concept,
        generatedAt: new Date().toISOString(),
      })
    }
  }
  return insights
}

function detectKnowledgeGaps(
  approvedEntries: LearningEntry[],
): LearningInsight[] {
  const domainCounts = new Map<LearningTopicDomain, number>()
  for (const e of approvedEntries) {
    domainCounts.set(e.topicDomain, (domainCounts.get(e.topicDomain) ?? 0) + 1)
  }

  const insights: LearningInsight[] = []
  for (const domain of ALL_DOMAINS) {
    if (domain === 'general') continue // general is expected to be sparse
    const count = domainCounts.get(domain) ?? 0
    if (count < 2) {
      insights.push({
        id: insightId(),
        type: 'knowledge_gap',
        title: `Knowledge gap: ${domain.replace(/_/g, ' ')}`,
        detail: `Only ${count} approved learning${count === 1 ? '' : 's'} exist in the "${domain.replace(/_/g, ' ')}" domain. DONNA lacks context here.`,
        recommendedAction: `Add more observations or have Brian directly teach DONNA about "${domain.replace(/_/g, ' ')}".`,
        severity: 'low',
        affectedEntryIds: [],
        affectedDomain: domain,
        affectedConcept: null,
        generatedAt: new Date().toISOString(),
      })
    }
  }
  return insights
}

function detectHighValueClusters(
  clusters: LearningCluster[],
  allEntries: LearningEntry[],
): LearningInsight[] {
  const insights: LearningInsight[] = []
  for (const cluster of clusters) {
    if (cluster.avgScore >= 70 && cluster.frequency >= 3) {
      const entryIds = cluster.entryIds
      const sample = allEntries.find(e => entryIds.includes(e.id))
      insights.push({
        id: insightId(),
        type: 'high_value_cluster',
        title: `High-value cluster: ${cluster.label}`,
        detail: `${cluster.frequency} related learnings with average score ${cluster.avgScore}. This is a well-evidenced pattern worth acting on.`,
        recommendedAction: `Review the "${cluster.label}" cluster and consider promoting entries to Academy Knowledge.`,
        severity: 'medium',
        affectedEntryIds: cluster.entryIds,
        affectedDomain: sample?.topicDomain ?? null,
        affectedConcept: cluster.dominantConcepts[0] ?? null,
        generatedAt: new Date().toISOString(),
      })
    }
  }
  return insights
}

function detectStaleReviews(entries: LearningEntry[]): LearningInsight[] {
  const staleCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000  // 7 days
  const stale = entries.filter(
    e => e.status === 'captured'
      && new Date(e.createdAt).getTime() < staleCutoff,
  )

  if (stale.length === 0) return []

  return [{
    id: insightId(),
    type: 'stale_review',
    title: `${stale.length} learnings awaiting review for 7+ days`,
    detail: `${stale.length} captured learning${stale.length === 1 ? '' : 's'} have been sitting unreviewed for more than a week.`,
    recommendedAction: 'Open the Review Queue and process pending learnings.',
    severity: stale.length >= 5 ? 'high' : 'medium',
    affectedEntryIds: stale.map(e => e.id),
    affectedDomain: null,
    affectedConcept: null,
    generatedAt: new Date().toISOString(),
  }]
}

function detectOwnerTeachingGap(
  brianEntries: LearningEntry[],
  allEntries: LearningEntry[],
): LearningInsight[] {
  if (allEntries.length < 5) return []

  const brianShare = brianEntries.length / allEntries.length
  if (brianShare >= 0.20) return []  // 20%+ is fine

  return [{
    id: insightId(),
    type: 'owner_teaching_gap',
    title: 'Brian has taught DONNA very little directly',
    detail: `Only ${brianEntries.length} of ${allEntries.length} total learnings originate from Brian directly (${Math.round(brianShare * 100)}%). DONNA is learning primarily from indirect signals.`,
    recommendedAction: 'Schedule a direct-teaching session where Brian explains key academy philosophy to DONNA.',
    severity: 'medium',
    affectedEntryIds: [],
    affectedDomain: null,
    affectedConcept: null,
    generatedAt: new Date().toISOString(),
  }]
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateInsights(
  allEntries: LearningEntry[],
  clusters: LearningCluster[] = [],
): InsightReport {
  const approvedEntries = allEntries.filter(
    e => e.status === 'approved' || e.status === 'promoted',
  )
  const brianEntries = allEntries.filter(e => e.sourceType === 'brian_direct')

  const insights: LearningInsight[] = [
    ...detectEmergingPatterns(approvedEntries),
    ...detectKnowledgeGaps(approvedEntries),
    ...detectHighValueClusters(clusters, allEntries),
    ...detectStaleReviews(allEntries),
    ...detectOwnerTeachingGap(brianEntries, allEntries),
  ]

  // Sort: high → medium → low → info
  const SEVERITY_RANK: Record<LearningInsight['severity'], number> = {
    high: 0, medium: 1, low: 2, info: 3,
  }
  insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

  // Top concern — most common concept
  const conceptCounts = new Map<AcademyOSConcept, number>()
  for (const e of approvedEntries) {
    for (const c of e.concepts) {
      conceptCounts.set(c, (conceptCounts.get(c) ?? 0) + 1)
    }
  }
  const sortedConcepts = Array.from(conceptCounts.entries()).sort((a, b) => b[1] - a[1])
  const topConcern = sortedConcepts[0]?.[0] ?? null

  // Weakest domain
  const domainCounts = new Map<LearningTopicDomain, number>()
  for (const e of approvedEntries) {
    domainCounts.set(e.topicDomain, (domainCounts.get(e.topicDomain) ?? 0) + 1)
  }
  const sortedDomains = ALL_DOMAINS
    .filter(d => d !== 'general')
    .map(d => ({ domain: d, count: domainCounts.get(d) ?? 0 }))
    .sort((a, b) => a.count - b.count)
  const weakestDomain = sortedDomains[0]?.domain ?? null

  const highSeverityCount = insights.filter(i => i.severity === 'high').length

  const summary = insights.length === 0
    ? 'No significant learning insights at this time.'
    : `${insights.length} insight${insights.length === 1 ? '' : 's'} identified${highSeverityCount > 0 ? `, ${highSeverityCount} high-priority` : ''}.`

  return {
    insights,
    totalCount: insights.length,
    highSeverityCount,
    topConcern,
    weakestDomain,
    summary,
  }
}
