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

// ── Main live executor ────────────────────────────────────────────────────────

/**
 * Execute a live DB-backed context tool.
 * Server-side only — uses dynamic imports for Supabase.
 * Always returns ToolCallResult — never throws.
 *
 * academyId must be provided — live tools require RLS-scoped academy context.
 * If academyId is missing, returns ok:false with a clear error.
 */
export async function executeLiveTool(
  tool: OrchestratorToolId,
  params: Record<string, unknown>,
): Promise<ToolCallResult> {
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
