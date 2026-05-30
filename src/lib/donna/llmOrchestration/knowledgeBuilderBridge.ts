// Sprint 988 — DONNA Knowledge Builder Retrieval Bridge V1
// Safe bridge for retrieving platform-owner-approved Knowledge Builder content.
// Pure TypeScript — no DB calls in this module. DB retrieval is in future sprints.
//
// Rules:
//   1. Knowledge Builder content must be approved by platform owner before DONNA uses it.
//   2. DONNA retrieves and surfaces approved content only.
//   3. Unapproved or draft content is never shown to directors, coaches, or parents.
//   4. Content visibility is scoped by: role, curriculum stage, content type, privacy level.
//   5. Knowledge Builder content never automatically becomes official curriculum.
//   6. DONNA may cite Knowledge Builder content as a source, not as ground truth.
//
// V1 architecture:
//   - KnowledgeEntry type (from local/memory source — DB retrieval in Sprint 990+)
//   - Visibility filter (role, stage, privacy)
//   - Source citation builder
//   - Content ranker (relevance to current page context)

// ── Knowledge types ───────────────────────────────────────────────────────────

export type KnowledgeContentType =
  | 'drill'              // A specific drill or exercise
  | 'coaching_tip'       // A coaching technique or tip
  | 'curriculum_note'    // A note about curriculum design
  | 'player_development' // Player development guidance
  | 'session_design'     // Session design principles
  | 'assessment_guide'   // Assessment guidance
  | 'parent_communication' // Parent communication guidance

export type KnowledgeVisibilityLevel =
  | 'director_only'      // Only the director can see this
  | 'director_coach'     // Director and coaches can see
  | 'all_staff'          // All staff (director, head_coach, coach)
  | 'parent_safe'        // Safe to surface in parent-facing context

export type KnowledgeApprovalStatus =
  | 'draft'              // Not yet approved — NEVER shown to users
  | 'under_review'       // Being reviewed — NEVER shown to users
  | 'approved'           // Platform owner approved — safe to retrieve
  | 'deprecated'         // Previously approved, now outdated — shown with warning

export interface KnowledgeEntry {
  id: string
  title: string
  /** Safe summary (no player names, no sensitive notes) */
  summary: string
  contentType: KnowledgeContentType
  /** Curriculum stages this applies to (e.g. ['red', 'orange']) */
  applicableStages: string[]
  visibilityLevel: KnowledgeVisibilityLevel
  approvalStatus: KnowledgeApprovalStatus
  /** Platform owner who approved this */
  approvedBy: string | null
  /** ISO timestamp of last approval */
  approvedAt: string | null
  /** Source label for citation */
  sourceLabel: string
  /** Whether this content is academy-specific or global library */
  scope: 'global' | 'academy'
}

// ── Visibility filter ─────────────────────────────────────────────────────────

export type KnowledgeBridgeRole = 'academy_director' | 'head_coach' | 'coach'

const ROLE_VISIBILITY_MAP: Record<KnowledgeBridgeRole, KnowledgeVisibilityLevel[]> = {
  academy_director: ['director_only', 'director_coach', 'all_staff', 'parent_safe'],
  head_coach: ['director_coach', 'all_staff', 'parent_safe'],
  coach: ['all_staff', 'parent_safe'],
}

/**
 * Filter knowledge entries to only those the given role can see.
 * Approved-only entries are returned — drafts and under_review are always blocked.
 */
export function filterKnowledgeByRole(
  entries: KnowledgeEntry[],
  role: KnowledgeBridgeRole,
): KnowledgeEntry[] {
  const allowedVisibility = ROLE_VISIBILITY_MAP[role]
  return entries.filter(e =>
    allowedVisibility.includes(e.visibilityLevel) &&
    (e.approvalStatus === 'approved' || e.approvalStatus === 'deprecated')
  )
}

/**
 * Filter knowledge entries to those relevant to a curriculum stage.
 * Returns entries applicable to the given stage, or entries with no stage restriction.
 */
export function filterKnowledgeByStage(
  entries: KnowledgeEntry[],
  stage: string,
): KnowledgeEntry[] {
  return entries.filter(e =>
    e.applicableStages.length === 0 || e.applicableStages.includes(stage.toLowerCase())
  )
}

// ── Source citation ───────────────────────────────────────────────────────────

export interface KnowledgeCitation {
  entryId: string
  title: string
  sourceLabel: string
  approvalStatus: KnowledgeApprovalStatus
  visibilityLevel: KnowledgeVisibilityLevel
  scope: KnowledgeEntry['scope']
  citationText: string
}

/**
 * Build a citation for a knowledge entry.
 * Deprecated entries get a warning appended.
 */
export function buildCitation(entry: KnowledgeEntry): KnowledgeCitation {
  const deprecated = entry.approvalStatus === 'deprecated'
  const scopeLabel = entry.scope === 'global' ? 'Global Knowledge Library' : 'Academy Knowledge'
  const citationText = deprecated
    ? `Source: ${entry.sourceLabel} (${scopeLabel}) — ⚠ This content is marked deprecated and may be outdated.`
    : `Source: ${entry.sourceLabel} (${scopeLabel})`

  return {
    entryId: entry.id,
    title: entry.title,
    sourceLabel: entry.sourceLabel,
    approvalStatus: entry.approvalStatus,
    visibilityLevel: entry.visibilityLevel,
    scope: entry.scope,
    citationText,
  }
}

// ── Content ranker ────────────────────────────────────────────────────────────

const CONTENT_TYPE_PAGE_AFFINITY: Record<string, KnowledgeContentType[]> = {
  '/director/curriculum': ['curriculum_note', 'player_development', 'assessment_guide'],
  '/director/class-templates': ['session_design', 'drill', 'coaching_tip'],
  '/director/sessions': ['session_design', 'coaching_tip'],
  '/director/players': ['player_development', 'assessment_guide'],
  '/director/review': ['coaching_tip', 'parent_communication'],
  '/director': ['player_development', 'curriculum_note'],
  '/coach': ['coaching_tip', 'session_design', 'drill'],
}

/**
 * Rank knowledge entries by relevance to the current page.
 * Entries with content types that match the page affinity rank higher.
 */
export function rankKnowledgeByPageAffinity(
  entries: KnowledgeEntry[],
  pathname: string,
): KnowledgeEntry[] {
  const affinityTypes = CONTENT_TYPE_PAGE_AFFINITY[pathname] ??
    Object.values(CONTENT_TYPE_PAGE_AFFINITY).flat()

  return [...entries].sort((a, b) => {
    const aScore = affinityTypes.indexOf(a.contentType)
    const bScore = affinityTypes.indexOf(b.contentType)
    if (aScore === -1 && bScore === -1) return 0
    if (aScore === -1) return 1
    if (bScore === -1) return -1
    return aScore - bScore
  })
}

// ── Safe DONNA response builder ───────────────────────────────────────────────

/**
 * Build a DONNA response that references Knowledge Builder content.
 * Always includes citation. Always notes that content is advisory, not official.
 */
export function buildKnowledgeResponse(
  entries: KnowledgeEntry[],
  userQuestion: string,
): string {
  if (entries.length === 0) {
    return `I don't have Knowledge Builder content that directly answers "${userQuestion.slice(0, 80)}". This may be covered in a future platform knowledge update.`
  }

  const top = entries[0]
  const citation = buildCitation(top)

  return [
    top.summary,
    '',
    citation.citationText,
    'This knowledge is advisory — it does not automatically change any curriculum or session records.',
  ].join('\n')
}

// ── V1 retrieval stub ─────────────────────────────────────────────────────────

/**
 * V1 stub: Knowledge retrieval from DB is not yet wired.
 * Sprint 990+ will implement DB-backed retrieval.
 * Returns an empty array until DB retrieval is wired.
 *
 * This stub exists so callers are typed correctly and can be upgraded
 * transparently when real retrieval is available.
 */
export async function retrieveApprovedKnowledge(params: {
  role: KnowledgeBridgeRole
  stage?: string
  contentTypes?: KnowledgeContentType[]
  pathname: string
  limit?: number
}): Promise<KnowledgeEntry[]> {
  // V1: DB retrieval not yet wired.
  // Sprint 990 (Academy State Retrieval) will wire the Supabase query here.
  // The query must: filter by academy_id (RLS), approvalStatus = 'approved',
  // visibility matches role, and optionally filter by stage/contentType.
  void params // used by future implementation
  return []
}
