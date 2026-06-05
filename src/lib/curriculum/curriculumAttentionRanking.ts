// Mega Sprint 1996–2005 — Curriculum Attention Ranking V1
// Deterministic priority scorer for curriculum improvement work.
// Combines bottleneck signals with coverage gaps to rank which levels need director attention first.
// Pure TypeScript — no DB calls, no AI, no side effects. Same inputs → same outputs.

import type { CurriculumBottleneckResult } from '@/lib/donna/curriculumBottleneckLoader'
import type { CurriculumCoverageReport, LevelCoverageScore } from '@/lib/curriculum/coverageModel'

// ── Output types ───────────────────────────────────────────────────────────────

export interface CurriculumAttentionPriority {
  levelId: string
  levelName: string
  levelKey: string | null        // e.g. 'orange2' — used for ?improve= routing
  stage: string
  stalledPlayers: number
  avgCompletionPct: number
  coverageScore: number
  lowestDomain: string | null
  priorityScore: number          // 0–100, higher = more urgent
  reason: string                 // compact human-readable summary
}

export type CurriculumAttentionScore = 'healthy' | 'needs_attention' | 'critical'

export interface CurriculumRankingResult {
  priorities: CurriculumAttentionPriority[]   // top 5, sorted by priorityScore desc
  attentionScore: CurriculumAttentionScore
  topConcern: string | null
  topConcernCount: number
  hasData: boolean
}

// ── Level key derivation ───────────────────────────────────────────────────────

const STAGE_KEY_PREFIX: Record<string, string> = {
  red_foundation:     'red',
  orange_development: 'orange',
  green_performance:  'green',
  yellow_competitive: 'yellow',
  high_performance:   'hp',
}

export function deriveLevelKeyFromSignal(stage: string, displayName: string): string | null {
  const prefix = STAGE_KEY_PREFIX[stage]
  const num = /(\d+)$/.exec(displayName)?.[1]
  return prefix && num ? `${prefix}${num}` : null
}

// ── Ranking engine ─────────────────────────────────────────────────────────────

export function rankCurriculumAttention(
  bottleneck: CurriculumBottleneckResult,
  coverage: CurriculumCoverageReport,
): CurriculumRankingResult {
  if (bottleneck.levelBottlenecks.length === 0) {
    return {
      priorities: [],
      attentionScore: 'healthy',
      topConcern: null,
      topConcernCount: 0,
      hasData: false,
    }
  }

  const coverageByLevelId = new Map<string, LevelCoverageScore>(
    coverage.levels.map(l => [l.levelId, l]),
  )

  const priorities: CurriculumAttentionPriority[] = bottleneck.levelBottlenecks.map(signal => {
    const coverageLevel = coverageByLevelId.get(signal.levelId)
    const coverageScore = coverageLevel?.scoreOutOf100 ?? 50

    // Priority score: stall weight (dominant) + completion deficit + coverage gap supplement
    const stalledWeight    = signal.stalled * 15
    const completionDeficit = 100 - signal.avgCompletionPct
    const coverageGap      = Math.round((100 - coverageScore) * 0.3)
    const priorityScore    = Math.min(100, stalledWeight + completionDeficit + coverageGap)

    const parts: string[] = []
    if (signal.stalled > 0) parts.push(`${signal.stalled} stalled`)
    if (signal.avgCompletionPct < 50) parts.push(`${signal.avgCompletionPct}% completion`)
    if (signal.lowestDomain) parts.push(`weak ${signal.lowestDomain}`)

    return {
      levelId:         signal.levelId,
      levelName:       signal.levelName,
      levelKey:        deriveLevelKeyFromSignal(signal.stage, signal.levelName),
      stage:           signal.stage,
      stalledPlayers:  signal.stalled,
      avgCompletionPct: signal.avgCompletionPct,
      coverageScore,
      lowestDomain:    signal.lowestDomain,
      priorityScore,
      reason:          parts.join(' · ') || 'Monitoring',
    }
  })

  priorities.sort((a, b) => b.priorityScore - a.priorityScore)
  const top5 = priorities.slice(0, 5)

  const topConcern      = bottleneck.topTaggedConcerns[0]?.tag ?? null
  const topConcernCount = bottleneck.topTaggedConcerns[0]?.count ?? 0

  const attentionScore: CurriculumAttentionScore =
    top5.some(p => p.priorityScore >= 60 || p.stalledPlayers >= 3) ? 'critical' :
    top5.some(p => p.priorityScore >= 25 || p.stalledPlayers > 0)  ? 'needs_attention' :
    'healthy'

  return {
    priorities: top5,
    attentionScore,
    topConcern,
    topConcernCount,
    hasData: true,
  }
}
