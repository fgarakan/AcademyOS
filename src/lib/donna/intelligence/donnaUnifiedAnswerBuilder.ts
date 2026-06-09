// Mega Sprint 1385–1414 — DONNA Unified Intelligence Pipeline V1
// Unified answer builder: formats a UnifiedIntelligenceContext into a structured
// DONNA answer with headline, detail, evidence, timeline highlights, relationships,
// missing information, recommendations, and intelligence trace.
// Pure TypeScript — no DB, no React, no side effects.

import type { UnifiedIntelligenceContext } from './donnaUnifiedIntelligenceContext'
import type { IntelligenceTrace } from './donnaIntelligenceTrace'
import type { TimelineEvent } from '@/lib/donna/entities/donnaEntityTimelineEngine'
import type { EntityRelationship } from '@/lib/donna/entities/donnaAcademyEntityModel'

// ── Answer type ───────────────────────────────────────────────────────────────

export interface TimelineHighlight {
  date:     string | null
  label:    string
  isUrgent: boolean
}

export interface RelationshipSummary {
  kind:             string
  label:            string
  targetId:         string
  targetDisplayName: string
}

export interface UnifiedAnswer {
  headline:              string
  detail:                string           // full markdown-formatted display text
  evidence:              string[]
  timelineHighlights:    TimelineHighlight[]
  relationships:         RelationshipSummary[]
  confidence:            'high' | 'medium' | 'low'
  missingInformation:    string[]
  recommendations:       string[]
  recommendedNextAction: string | null
  routeTarget:           string | null
  trace:                 IntelligenceTrace
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickTopTimelineEvents(events: TimelineEvent[], max = 3): TimelineHighlight[] {
  const sigOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...events].sort((a, b) => sigOrder[a.significance] - sigOrder[b.significance])
  return sorted.slice(0, max).map(e => ({
    date:     e.date,
    label:    e.label,
    isUrgent: e.significance === 'high',
  }))
}

function formatRelationships(rels: EntityRelationship[]): RelationshipSummary[] {
  return rels.slice(0, 4).map(r => ({
    kind:              r.kind,
    label:             `${r.kind.replace(/_/g, ' ')}: ${r.targetDisplayName}`,
    targetId:          r.targetId,
    targetDisplayName: r.targetDisplayName,
  }))
}

function buildDetailText(ctx: UnifiedIntelligenceContext): string {
  const lines: string[] = []

  lines.push(ctx.summary.headline)

  if (ctx.summary.detail) {
    lines.push('', ctx.summary.detail)
  }

  if (ctx.summary.evidence.length > 0) {
    lines.push('', '**Evidence:**')
    ctx.summary.evidence.forEach(e => lines.push(`• ${e}`))
  }

  const highlights = pickTopTimelineEvents(ctx.timeline)
  if (highlights.length > 0) {
    lines.push('', '**Recent timeline:**')
    highlights.forEach(h => {
      const prefix = h.date ? `${h.date} — ` : ''
      const marker = h.isUrgent ? '⚠ ' : ''
      lines.push(`• ${marker}${prefix}${h.label}`)
    })
  }

  if (ctx.relationships.length > 0) {
    const relLines = formatRelationships(ctx.relationships)
    lines.push('', '**Connections:**')
    relLines.forEach(r => lines.push(`• ${r.label}`))
  }

  if (ctx.summary.recommendations.length > 0) {
    lines.push('', '**Recommended actions:**')
    ctx.summary.recommendations.forEach(r => lines.push(`• ${r}`))
  }

  if (ctx.summary.limitations.length > 0) {
    lines.push('', `*Note: ${ctx.summary.limitations.join('; ')}*`)
  }

  return lines.join('\n')
}

// ── Main function ─────────────────────────────────────────────────────────────

export function buildUnifiedAnswer(ctx: UnifiedIntelligenceContext): UnifiedAnswer {
  return {
    headline:              ctx.summary.headline,
    detail:                buildDetailText(ctx),
    evidence:              ctx.summary.evidence,
    timelineHighlights:    pickTopTimelineEvents(ctx.timeline),
    relationships:         formatRelationships(ctx.relationships),
    confidence:            ctx.confidence,
    missingInformation:    ctx.dataGaps,
    recommendations:       ctx.summary.recommendations,
    recommendedNextAction: ctx.summary.recommendations[0] ?? null,
    routeTarget:           ctx.routeTarget,
    trace:                 ctx.trace,
  }
}
