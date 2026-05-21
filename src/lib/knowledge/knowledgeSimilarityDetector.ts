// Sprint 536 — Knowledge Similarity Detector
// Detects potential duplicate or overlapping items in the knowledge library.
// Deterministic token overlap — no AI API calls.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from './knowledgeTypes'

export interface KnowledgeSimilarityPair {
  itemIdA: string
  itemIdB: string
  titleA: string
  titleB: string
  overlapScore: number
  sharedTokens: string[]
  sharedTags: string[]
  sameDomain: boolean
  isSuspectedDuplicate: boolean
}

export interface KnowledgeSimilarityReport {
  pairs: KnowledgeSimilarityPair[]
  suspectedDuplicateCount: number
  totalPairsChecked: number
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are',
  'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'with',
  'this', 'that', 'from', 'by', 'it', 'its', 'as', 'but', 'not', 'can', 'will',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t))
}

function computeOverlapScore(setA: Set<string>, setB: Set<string>): { score: number; shared: string[] } {
  const shared: string[] = []
  for (const token of Array.from(setA)) {
    if (setB.has(token)) shared.push(token)
  }
  const union = new Set([...Array.from(setA), ...Array.from(setB)])
  const score = union.size > 0 ? shared.length / union.size : 0
  return { score, shared }
}

function computeTagOverlap(tagsA: string[], tagsB: string[]): string[] {
  const setB = new Set(tagsB)
  return tagsA.filter(t => setB.has(t))
}

export function detectKnowledgeSimilarity(
  items: KnowledgeItem[],
  threshold = 0.35,
): KnowledgeSimilarityReport {
  const pairs: KnowledgeSimilarityPair[] = []

  const tokenSets: Map<string, Set<string>> = new Map()
  for (const item of items) {
    const combined = `${item.title} ${item.summary}`
    tokenSets.set(item.itemId, new Set(tokenize(combined)))
  }

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      const setA = tokenSets.get(a.itemId) ?? new Set<string>()
      const setB = tokenSets.get(b.itemId) ?? new Set<string>()

      const { score, shared } = computeOverlapScore(setA, setB)
      const sharedTags = computeTagOverlap(a.tags, b.tags)
      const sameDomain = a.domain === b.domain

      if (score >= threshold || (sharedTags.length >= 3 && sameDomain)) {
        pairs.push({
          itemIdA: a.itemId,
          itemIdB: b.itemId,
          titleA: a.title,
          titleB: b.title,
          overlapScore: Math.round(score * 100) / 100,
          sharedTokens: shared.slice(0, 10),
          sharedTags,
          sameDomain,
          isSuspectedDuplicate: score >= 0.6 || (score >= threshold && sharedTags.length >= 5 && sameDomain),
        })
      }
    }
  }

  pairs.sort((a, b) => b.overlapScore - a.overlapScore)

  return {
    pairs,
    suspectedDuplicateCount: pairs.filter(p => p.isSuspectedDuplicate).length,
    totalPairsChecked: (items.length * (items.length - 1)) / 2,
  }
}

export function getSimilarItems(
  report: KnowledgeSimilarityReport,
  itemId: string,
): KnowledgeSimilarityPair[] {
  return report.pairs.filter(p => p.itemIdA === itemId || p.itemIdB === itemId)
}

export function getSuspectedDuplicates(
  report: KnowledgeSimilarityReport,
): KnowledgeSimilarityPair[] {
  return report.pairs.filter(p => p.isSuspectedDuplicate)
}
