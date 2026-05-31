// Sprint 1002 — DONNA Live Academy Context Tool Executor V1
// Async DB-backed executors for get_academy_state and get_player_development_summary.
// Server-side only — never import directly into client components.
// Uses dynamic imports for Supabase server client and retrieval modules.
//
// Safety guarantees:
//   - All queries go through Supabase with full RLS enforcement
//   - academyId always scopes queries in addition to RLS
//   - Returns counts and flags only — no player names, no coach notes, no raw IDs
//   - Partial failures are non-fatal — partial data returned with errors logged
//   - Never throws — always returns ToolCallResult
//
// Usage (from toolExecutionLoop.ts async path):
//   const result = await executeLiveTool('get_academy_state', { academyId: '...' })
//   result.ok === true → result.data is AcademyStateSummary
//   result.ok === false → use fallback text

import type { OrchestratorToolId } from './types'
import type { ToolCallResult } from './toolCallingContract'

// ── Live tool set ─────────────────────────────────────────────────────────────

export const LIVE_TOOL_IDS: ReadonlySet<OrchestratorToolId> = new Set<OrchestratorToolId>([
  'get_academy_state',
  'get_player_development_summary',
  // Sprint 1003 — player-specific context tool (playerId from route context)
  'get_player_profile_summary',
  // Sprint 1004 — session-specific context tool (sessionId from route context)
  'get_session_context',
  // Sprint 1015 — curriculum context tool (academyId from server auth)
  'get_curriculum_context',
  // Sprint 1017 — knowledge builder retrieval (query from LLM, academyId from server auth)
  'get_knowledge_content',
])

export function isLiveTool(toolId: OrchestratorToolId): boolean {
  return LIVE_TOOL_IDS.has(toolId)
}

// ── Academy state executor ────────────────────────────────────────────────────

async function execGetAcademyState(academyId: string): Promise<ToolCallResult> {
  try {
    // Dynamic imports — server-side only, keeps Supabase out of client bundle
    const { getSupabaseServer } = await import('@/lib/supabase/server')
    const { retrieveAcademyState } = await import('./academyStateRetrieval')

    const supabase = await getSupabaseServer()
    const result = await retrieveAcademyState(supabase, academyId)

    const { summary } = result
    const summaryText = [
      `Pending review items: ${summary.pendingReviewCount}`,
      `Today's sessions: ${summary.todaySessionCount}`,
      `Missing coach recaps: ${summary.hasMissingRecaps ? 'yes' : 'none'}`,
      `Active players: ${summary.activePlayers}`,
      `Players needing placement: ${summary.hasPlayersNeedingPlacement ? 'yes' : 'none'}`,
      `Advancement-eligible players: ${summary.hasAdvancementEligiblePlayers ? 'yes' : 'none'}`,
      `Academy health: ${summary.academyHealthSignal.replace('_', ' ')}`,
    ].join('. ')

    if (result.errors.length > 0) {
      return {
        tool: 'get_academy_state',
        ok: true,
        data: summary,
        summary: summaryText + ` (${result.errors.length} query error(s) — partial data)`,
        requiresConfirmation: false,
        auditEntry: `tool:get_academy_state partial health=${summary.academyHealthSignal} errors=${result.errors.length}`,
      }
    }

    return {
      tool: 'get_academy_state',
      ok: true,
      data: summary,
      summary: summaryText,
      requiresConfirmation: false,
      auditEntry: `tool:get_academy_state health=${summary.academyHealthSignal} pending=${summary.pendingReviewCount}`,
    }
  } catch (err) {
    return {
      tool: 'get_academy_state',
      ok: false,
      data: null,
      summary: '',
      error: `Academy state retrieval failed: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_academy_state ERROR`,
    }
  }
}

// ── Player development executor ───────────────────────────────────────────────

async function execGetPlayerDevelopmentSummary(academyId: string): Promise<ToolCallResult> {
  try {
    const { getSupabaseServer } = await import('@/lib/supabase/server')
    const { retrievePlayerDevelopmentContext } = await import('./playerDevelopmentRetrieval')

    const supabase = await getSupabaseServer()
    const result = await retrievePlayerDevelopmentContext(supabase, academyId)

    const { summary } = result
    const flags = summary.attentionFlags
    const summaryText = [
      `Active players: ${summary.totalActivePlayers}`,
      `Players with curriculum level: ${summary.playersWithCurriculumLevel}`,
      `Players without curriculum level: ${summary.playersWithoutCurriculumLevel}`,
      `Players needing placement: ${summary.playersNeedingPlacement}`,
      `Advancement-eligible: ${summary.advancementEligibleCount}`,
      flags.assessmentOverdue > 0 ? `Assessment overdue: ${flags.assessmentOverdue}` : null,
    ].filter(Boolean).join('. ')

    if (result.errors.length > 0) {
      return {
        tool: 'get_player_development_summary',
        ok: true,
        data: summary,
        summary: summaryText + ` (${result.errors.length} query error(s) — partial data)`,
        requiresConfirmation: false,
        auditEntry: `tool:get_player_development_summary partial total=${summary.totalActivePlayers} errors=${result.errors.length}`,
      }
    }

    return {
      tool: 'get_player_development_summary',
      ok: true,
      data: summary,
      summary: summaryText,
      requiresConfirmation: false,
      auditEntry: `tool:get_player_development_summary total=${summary.totalActivePlayers} advancement=${summary.advancementEligibleCount}`,
    }
  } catch (err) {
    return {
      tool: 'get_player_development_summary',
      ok: false,
      data: null,
      summary: '',
      error: `Player development retrieval failed: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_player_development_summary ERROR`,
    }
  }
}

// ── Sprint 1004: Session context executor ────────────────────────────────────

async function execGetSessionContext(
  sessionId: string,
  academyId: string,
): Promise<ToolCallResult> {
  try {
    const { getSupabaseServer } = await import('@/lib/supabase/server')
    const { retrieveSessionContext } = await import('./sessionContextRetrieval')

    const supabase = await getSupabaseServer()
    const result = await retrieveSessionContext(supabase, sessionId, academyId)

    const { summary } = result
    const parts = [
      summary.sessionName ? `Session: ${summary.sessionName}` : 'Session: unnamed',
      summary.sessionStatus ? `Status: ${summary.sessionStatus.replace(/_/g, ' ')}` : null,
      summary.scheduledDate ? `Scheduled: ${summary.scheduledDate}${summary.scheduledTime ? ` at ${summary.scheduledTime}` : ''}` : null,
      summary.durationMin ? `Duration: ${summary.durationMin} min` : null,
      summary.templateName ? `Template: ${summary.templateName}` : 'Template: not assigned',
      summary.coachName ? `Coach: ${summary.coachName}` : 'Coach: not assigned',
      summary.groupName ? `Group: ${summary.groupName}` : null,
      `Blocks planned: ${summary.blockCount}`,
      summary.attendance.recorded
        ? `Attendance: ${summary.attendance.present} present, ${summary.attendance.absent} absent of ${summary.attendance.total} total`
        : 'Attendance: not yet recorded',
      `Wrap-up status: ${summary.wrapUpStatus.replace(/_/g, ' ')}`,
      summary.needsDirectorReview ? 'A coach wrap-up is waiting for your review.' : null,
    ].filter(Boolean).join('. ')

    const partialNote = result.errors.length > 0 ? ` (${result.errors.length} query error(s) — partial data)` : ''

    return {
      tool: 'get_session_context',
      ok: true,
      data: summary,
      summary: parts + partialNote,
      requiresConfirmation: false,
      auditEntry: `tool:get_session_context status=${summary.sessionStatus ?? 'unknown'} wrapUp=${summary.wrapUpStatus} blocks=${summary.blockCount}`,
    }
  } catch (err) {
    return {
      tool: 'get_session_context',
      ok: false,
      data: null,
      summary: '',
      error: `Session context retrieval failed: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_session_context ERROR`,
    }
  }
}

// ── Sprint 1017: Knowledge Builder retrieval executor ────────────────────────

async function execGetKnowledgeContent(params: Record<string, unknown>): Promise<ToolCallResult> {
  const query = typeof params['query'] === 'string' ? params['query'].slice(0, 200) : 'general'
  const contentType = typeof params['contentType'] === 'string' ? params['contentType'] : undefined
  const stage = typeof params['stage'] === 'string' ? params['stage'] : undefined

  try {
    const { retrieveApprovedKnowledge, filterKnowledgeByRole, rankKnowledgeByPageAffinity, buildKnowledgeResponse } =
      await import('./knowledgeBuilderBridge')

    // V1: retrieveApprovedKnowledge returns [] until DB knowledge table is wired.
    // When KB table exists, the bridge will return approved entries here.
    const raw = await retrieveApprovedKnowledge({
      role: 'academy_director',
      contentTypes: contentType ? [contentType as import('./knowledgeBuilderBridge').KnowledgeContentType] : undefined,
      stage,
      pathname: '/director',
      limit: 5,
    })

    const filtered = filterKnowledgeByRole(raw, 'academy_director')
    const ranked = rankKnowledgeByPageAffinity(filtered, '/director')
    const responseText = buildKnowledgeResponse(ranked, query)

    return {
      tool: 'get_knowledge_content',
      ok: true,
      data: { entries: ranked.map(e => ({ title: e.title, contentType: e.contentType, summary: e.summary })) },
      summary: responseText,
      requiresConfirmation: false,
      auditEntry: `tool:get_knowledge_content query="${query.slice(0, 40)}" results=${ranked.length}`,
    }
  } catch (err) {
    return {
      tool: 'get_knowledge_content',
      ok: false,
      data: null,
      summary: '',
      error: `Knowledge content retrieval failed: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_knowledge_content ERROR`,
    }
  }
}

// ── Sprint 1015: Curriculum context executor ─────────────────────────────────

async function execGetCurriculumContext(academyId: string): Promise<ToolCallResult> {
  try {
    const { getSupabaseServer } = await import('@/lib/supabase/server')
    const { retrieveCurriculumContext } = await import('./curriculumContextRetrieval')

    const supabase = await getSupabaseServer()
    const result = await retrieveCurriculumContext(supabase, academyId)

    const { summary } = result
    const parts = [
      `Total curriculum levels: ${summary.totalLevels}`,
      summary.hasCurriculumDraft
        ? `Pending curriculum change drafts: ${summary.pendingCurriculumDrafts}`
        : 'No pending curriculum change drafts',
    ].join('. ')

    const partialNote = result.errors.length > 0 ? ` (${result.errors.length} query error(s) — partial data)` : ''

    return {
      tool: 'get_curriculum_context',
      ok: true,
      data: summary,
      summary: parts + partialNote,
      requiresConfirmation: false,
      auditEntry: `tool:get_curriculum_context levels=${summary.totalLevels} pendingDrafts=${summary.pendingCurriculumDrafts}`,
    }
  } catch (err) {
    return {
      tool: 'get_curriculum_context',
      ok: false,
      data: null,
      summary: '',
      error: `Curriculum context retrieval failed: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_curriculum_context ERROR`,
    }
  }
}

// ── Main live executor ────────────────────────────────────────────────────────

// ── Sprint 1003: Player profile executor ─────────────────────────────────────

async function execGetPlayerProfileSummary(
  playerId: string,
  academyId: string,
): Promise<ToolCallResult> {
  try {
    const { getSupabaseServer } = await import('@/lib/supabase/server')
    const { retrievePlayerProfileSummary } = await import('./playerProfileRetrieval')

    const supabase = await getSupabaseServer()
    const result = await retrievePlayerProfileSummary(supabase, playerId, academyId)

    const { summary } = result
    const parts = [
      summary.currentLevelLabel ? `Current level: ${summary.currentLevelLabel}` : 'No curriculum level assigned',
      summary.playerStatus ? `Status: ${summary.playerStatus.replace(/_/g, ' ')}` : null,
      summary.advancementEligible ? 'Advancement: eligible for review' : null,
      `Active priorities: ${summary.activePriorityCount}`,
      `Recent sessions (30 days): ${summary.recentSessionCount}`,
      summary.evidenceCount > 0 ? `Development evidence recorded: ${summary.evidenceCount}` : 'No development evidence yet',
      summary.assessmentOverdue ? 'Assessment: overdue — review recommended' : null,
    ].filter(Boolean).join('. ')

    const partialNote = result.errors.length > 0 ? ` (${result.errors.length} query error(s) — partial data)` : ''

    return {
      tool: 'get_player_profile_summary',
      ok: true,
      data: summary,
      summary: parts + partialNote,
      requiresConfirmation: false,
      auditEntry: `tool:get_player_profile_summary level=${summary.currentLevelLabel ?? 'none'} advancement=${summary.advancementEligible}`,
    }
  } catch (err) {
    return {
      tool: 'get_player_profile_summary',
      ok: false,
      data: null,
      summary: '',
      error: `Player profile retrieval failed: ${err instanceof Error ? err.message : String(err)}`,
      requiresConfirmation: false,
      auditEntry: `tool:get_player_profile_summary ERROR`,
    }
  }
}

// ── Main live executor ────────────────────────────────────────────────────────

/**
 * Execute a live DB-backed context tool.
 * Server-side only — uses dynamic imports for Supabase.
 * Always returns ToolCallResult — never throws.
 *
 * academyId must be provided for academy-scoped tools.
 * playerId must be provided for player-specific tools (from route context, never from LLM).
 */
export async function executeLiveTool(
  tool: OrchestratorToolId,
  params: Record<string, unknown>,
): Promise<ToolCallResult> {
  // Sprint 1003 — player-specific tool uses playerId (injected from route, not from LLM)
  if (tool === 'get_player_profile_summary') {
    const playerId = typeof params['playerId'] === 'string' ? params['playerId'] : null
    const academyId = typeof params['academyId'] === 'string' ? params['academyId'] : null

    if (!playerId || playerId.length < 10) {
      return {
        tool,
        ok: false,
        data: null,
        summary: '',
        error: `Tool '${tool}' requires a valid playerId from route context. The LLM cannot supply this.`,
        requiresConfirmation: false,
        auditEntry: `tool:${tool} FAILED missing_playerId`,
      }
    }
    if (!academyId || academyId.length < 10) {
      return {
        tool,
        ok: false,
        data: null,
        summary: '',
        error: `Tool '${tool}' requires academyId for RLS scoping.`,
        requiresConfirmation: false,
        auditEntry: `tool:${tool} FAILED missing_academyId`,
      }
    }
    return execGetPlayerProfileSummary(playerId, academyId)
  }

  // Sprint 1004 — session-specific tool (sessionId + academyId from route context)
  if (tool === 'get_session_context') {
    const sessionId = typeof params['sessionId'] === 'string' ? params['sessionId'] : null
    const academyId = typeof params['academyId'] === 'string' ? params['academyId'] : null

    if (!sessionId || sessionId.length < 10) {
      return {
        tool,
        ok: false,
        data: null,
        summary: '',
        error: `Tool '${tool}' requires a valid sessionId from route context. The LLM cannot supply this.`,
        requiresConfirmation: false,
        auditEntry: `tool:${tool} FAILED missing_sessionId`,
      }
    }
    if (!academyId || academyId.length < 10) {
      return {
        tool,
        ok: false,
        data: null,
        summary: '',
        error: `Tool '${tool}' requires academyId for RLS scoping.`,
        requiresConfirmation: false,
        auditEntry: `tool:${tool} FAILED missing_academyId`,
      }
    }
    return execGetSessionContext(sessionId, academyId)
  }

  // Academy-scoped tools require academyId
  const academyId = typeof params['academyId'] === 'string' ? params['academyId'] : null

  if (!academyId || academyId.length < 10) {
    return {
      tool,
      ok: false,
      data: null,
      summary: '',
      error: `Tool '${tool}' requires a valid academyId. Provided: '${academyId}'.`,
      requiresConfirmation: false,
      auditEntry: `tool:${tool} FAILED missing_academyId`,
    }
  }

  switch (tool) {
    case 'get_academy_state':
      return execGetAcademyState(academyId)
    case 'get_player_development_summary':
      return execGetPlayerDevelopmentSummary(academyId)
    // Sprint 1015 — curriculum context (academyId-scoped, no raw content)
    case 'get_curriculum_context':
      return execGetCurriculumContext(academyId)
    // Sprint 1017 — knowledge builder retrieval (params from LLM, not route context)
    case 'get_knowledge_content':
      return execGetKnowledgeContent(params)
    default:
      return {
        tool,
        ok: false,
        data: null,
        summary: '',
        error: `Tool '${tool}' is not a live context tool.`,
        requiresConfirmation: false,
        auditEntry: `tool:${tool} NOT_LIVE`,
      }
  }
}
