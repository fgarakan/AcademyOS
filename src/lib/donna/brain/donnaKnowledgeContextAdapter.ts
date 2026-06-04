// Sprint 1911–1960 — DONNA Unified Conversation Brain V1
// Knowledge Builder context adapter placeholder.
//
// Prepares DONNA for future Knowledge Builder retrieval.
// V1: returns empty stubs — no DB retrieval yet.
// When the Knowledge Builder DB table is live, this adapter becomes
// the single injection point for approved knowledge into DONNA responses.
//
// Architecture (future state):
//   External Knowledge
//   ↓ Knowledge Builder
//   ↓ Platform Owner Review
//   ↓ Approved Knowledge Library (DB)
//   ↓ retrieveApprovedKnowledge() [in knowledgeBuilderBridge.ts]
//   ↓ KnowledgeContext (this file)
//   ↓ DONNA response with source attribution
//
// Design rules:
//   - Unapproved knowledge is NEVER surfaced. approval_status = 'draft' | 'under_review' → blocked.
//   - All knowledge includes a trust level and source label.
//   - Role-safe: parent/player only see 'parent_safe' visibility entries.
//   - DONNA cites knowledge as advisory, not ground truth.

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

// ── Empty stub ────────────────────────────────────────────────────────────────
// V1: no DB retrieval. Returns an honest empty context.
// Replace with real retrieval when KB DB table is ready.

export function buildEmptyKnowledgeContext(): KnowledgeContext {
  return {
    approvedSnippets: [],
    curriculumReferences: [],
    overallTrustLevel: 'advisory',
    roleSafeSummary: null,
    limitations: 'Knowledge Builder is not yet connected. Responses are based on live academy data only.',
    isLive: false,
  }
}

/**
 * Retrieve approved knowledge for a given query and role.
 * V1: returns empty stubs. Wire real retrieval here when KB DB table is live.
 */
export function retrieveKnowledgeContext(_params: {
  query: string
  role: 'director' | 'coach' | 'parent' | 'player'
  currentStage?: string | null
  currentRoute?: string | null
}): KnowledgeContext {
  // V1 stub — KB retrieval not yet wired to DB.
  // See: src/lib/donna/llmOrchestration/knowledgeBuilderBridge.ts
  // for the types and approval pipeline that will feed this function.
  return buildEmptyKnowledgeContext()
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
