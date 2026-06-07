// Mega Sprint 904–933C — DONNA Brain Runtime Wiring V1
// (Originally Sprint 1911–1960 — DONNA Unified Conversation Brain V1)
//
// Knowledge context adapter. Now backed by the certified Initial Brain
// via donnaBrainRuntime.ts. No longer a stub.
//
// Architecture:
//   DONNA Global Brain (initialBrainSeed.ts — 21 certified entries)
//   ↓ donnaBrainRuntime.queryBrain()     ← brain lookup, this sprint
//   ↓ retrieveKnowledgeContext()          ← this file, converts to KnowledgeContext
//   ↓ formatKnowledgeForResponse()        ← this file, formats for DONNA text
//   ↓ processDonnaMessage.ts Step 12.5    ← injection into response pipeline
//
// Future path (unchanged from original intent):
//   ↓ retrieveApprovedKnowledge() [knowledgeBuilderBridge.ts]  ← DB Knowledge Builder (future)
//   ↓ KnowledgeContext (merge with brain results)
//
// Design rules:
//   - Unapproved knowledge is NEVER surfaced. approval_status = 'draft' | 'under_review' → blocked.
//   - All knowledge includes a trust level and source label.
//   - Role-safe: parent/player only see 'parent_safe' visibility entries.
//   - DONNA cites knowledge as advisory, not ground truth.
//   - Brain entries are 'high' trust — they are platform-owner certified constants.

import { queryBrain } from './donnaBrainRuntime'
import type { BrainQueryParams, BrainQueryResult } from './donnaBrainRuntime'
import type { SeedBrainEntry } from './initialBrainSeed'

// ── Types ─────────────────────────────────────────────────────────────────────

export type KnowledgeTrustLevel = 'high' | 'medium' | 'advisory'

export type KnowledgeVisibility = 'director_only' | 'director_coach' | 'all_staff' | 'parent_safe'

export interface ApprovedKnowledgeSnippet {
  id: string
  title: string
  summary: string
  sourceLabel: string
  trustLevel: KnowledgeTrustLevel
  visibility: KnowledgeVisibility
  applicableStages: string[]
  approvedAt: string | null
  limitations: string | null
}

export interface CurriculumReference {
  levelName: string
  domain: string
  skillTarget: string
  evidenceRequired: string | null
}

/** The complete knowledge context injected into a DONNA response. */
export interface KnowledgeContext {
  /** Approved knowledge snippets relevant to the current query. */
  approvedSnippets: ApprovedKnowledgeSnippet[]
  /** Curriculum references for the current player/level. */
  curriculumReferences: CurriculumReference[]
  /** Overall trust level of this knowledge package. */
  overallTrustLevel: KnowledgeTrustLevel
  /** Human-readable source attribution for UI display. */
  roleSafeSummary: string | null
  /** Known gaps or caveats in the knowledge. */
  limitations: string | null
  /** True when the KB DB is connected and returning real data. */
  isLive: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildEmptyKnowledgeContext(): KnowledgeContext {
  return {
    approvedSnippets: [],
    curriculumReferences: [],
    overallTrustLevel: 'advisory',
    roleSafeSummary: null,
    limitations: 'No matching brain entries for this query.',
    isLive: false,
  }
}

function entryVisibility(entry: SeedBrainEntry): KnowledgeVisibility {
  switch (entry.type) {
    case 'philosophy':    return 'all_staff'
    case 'vocabulary':    return 'director_coach'
    case 'decision_rule': return 'director_coach'
    case 'intent':        return 'director_only'
    default:              return 'director_coach'
  }
}

function brainResultToContext(result: BrainQueryResult): KnowledgeContext {
  if (!result.hasMatches) return buildEmptyKnowledgeContext()

  const snippets: ApprovedKnowledgeSnippet[] = result.matched.map(entry => ({
    id:              entry.id,
    title:           entry.label,
    summary:         entry.definition,
    sourceLabel:     `DONNA Global Brain — ${entry.source.symbol}`,
    trustLevel:      'high' as KnowledgeTrustLevel,
    visibility:      entryVisibility(entry),
    applicableStages: entry.tags,
    approvedAt:      entry.promotedAt,
    limitations:     null,
  }))

  const count = snippets.length
  return {
    approvedSnippets:    snippets,
    curriculumReferences: [],
    overallTrustLevel:   'high',
    roleSafeSummary:     `From DONNA Global Brain: ${count} certified entr${count === 1 ? 'y' : 'ies'}.`,
    limitations:         null,
    isLive:              true,
  }
}

// ── Public retrieval ──────────────────────────────────────────────────────────

/**
 * Retrieve knowledge context for a query. Now backed by the certified
 * DONNA Global Brain (donnaBrainRuntime.ts). Returns isLive: true when
 * the brain has matching entries; isLive: false when no match.
 *
 * Future: when KB DB table is live, merge DB results with brain results here.
 * See: src/lib/donna/llmOrchestration/knowledgeBuilderBridge.ts
 */
export function retrieveKnowledgeContext(params: {
  query: string
  role: 'director' | 'coach' | 'parent' | 'player'
  currentStage?: string | null
  currentRoute?: string | null
}): KnowledgeContext {
  const brainParams: BrainQueryParams = {
    query:        params.query,
    role:         params.role,
    currentRoute: params.currentRoute ?? null,
  }
  const result = queryBrain(brainParams)
  return brainResultToContext(result)
}

/** Format the knowledge context for injection into a DONNA response. */
export function formatKnowledgeForResponse(ctx: KnowledgeContext): string | null {
  if (!ctx.isLive || ctx.approvedSnippets.length === 0) return null

  const lines: string[] = []
  ctx.approvedSnippets.slice(0, 3).forEach(s => {
    lines.push(`**${s.title}** *(${s.sourceLabel}, ${s.trustLevel} confidence)*`)
    lines.push(s.summary)
    if (s.limitations) lines.push(`_Note: ${s.limitations}_`)
  })

  return lines.join('\n\n')
}
