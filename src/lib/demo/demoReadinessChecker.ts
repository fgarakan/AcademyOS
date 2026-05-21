// Sprint 451 — Demo Readiness Checker V1
// Validates that an academy has sufficient seed data for a demo.
// Read-only queries. No mutations. No AI calls. Server-side only.
// Used by the /dev/diagnostics page and the demo setup checklist.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface DemoCheck {
  name: string
  passed: boolean
  detail: string
}

export interface DemoReadinessReport {
  academyId: string
  generatedAt: string
  overallReady: boolean
  passCount: number
  failCount: number
  checks: DemoCheck[]
}

// Checks whether at least one active player exists with basic data.
export async function checkPlayerHasRequiredData(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<DemoCheck> {
  const { data, error } = await db
    .from('players')
    .select('id, first_name, last_name, current_level_id, is_active')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (error || !data) {
    return { name: 'player_exists', passed: false, detail: 'Player not found.' }
  }
  if (!data.is_active) {
    return { name: 'player_exists', passed: false, detail: 'Player is not active.' }
  }
  if (!data.current_level_id) {
    return { name: 'player_exists', passed: false, detail: 'Player has no curriculum level assigned.' }
  }

  return {
    name: 'player_exists',
    passed: true,
    detail: `Player "${data.first_name} ${data.last_name}" is active with a level assigned.`,
  }
}

// Checks whether the academy has at least one session in any status.
export async function checkAcademyHasSessionData(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<DemoCheck> {
  const { count, error } = await db
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)

  if (error) {
    return { name: 'sessions_exist', passed: false, detail: 'Could not query sessions.' }
  }
  const n = count ?? 0
  if (n === 0) {
    return { name: 'sessions_exist', passed: false, detail: 'No sessions found — seed required.' }
  }

  return { name: 'sessions_exist', passed: true, detail: `${n} session(s) found.` }
}

// Checks whether the academy has at least one published template.
export async function checkAcademyHasTemplates(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<DemoCheck> {
  const { count, error } = await db
    .from('templates')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('is_active', true)

  if (error) {
    return { name: 'templates_exist', passed: false, detail: 'Could not query templates.' }
  }
  const n = count ?? 0
  if (n === 0) {
    return { name: 'templates_exist', passed: false, detail: 'No active templates found — seed required.' }
  }

  return { name: 'templates_exist', passed: true, detail: `${n} active template(s) found.` }
}

// Checks whether any players have development summaries approved for parent view.
export async function checkParentSafeSummariesExist(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<DemoCheck> {
  const { count, error } = await db
    .from('player_development_summary')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('show_to_parent', true)

  if (error) {
    return { name: 'parent_safe_summaries', passed: false, detail: 'Could not query summaries.' }
  }
  const n = count ?? 0
  if (n === 0) {
    return {
      name: 'parent_safe_summaries',
      passed: false,
      detail: 'No parent-safe development summaries found. Set show_to_parent=true on at least one.',
    }
  }

  return { name: 'parent_safe_summaries', passed: true, detail: `${n} parent-visible summary/summaries.` }
}

// Checks whether there is any player requirement progress data for the academy.
export async function checkProgressDataExists(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<DemoCheck> {
  const { count, error } = await db
    .from('player_requirement_progress')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)

  if (error) {
    return { name: 'progress_data', passed: false, detail: 'Could not query progress.' }
  }
  const n = count ?? 0
  if (n === 0) {
    return {
      name: 'progress_data',
      passed: false,
      detail: 'No requirement progress records found — seed required.',
    }
  }

  return { name: 'progress_data', passed: true, detail: `${n} progress record(s) found.` }
}

// Checks whether at least one pending proposed_action exists for demo approval flow.
export async function checkPendingActionsExist(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<DemoCheck> {
  const { count, error } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')

  if (error) {
    return { name: 'pending_actions', passed: false, detail: 'Could not query proposed actions.' }
  }
  const n = count ?? 0
  if (n === 0) {
    return {
      name: 'pending_actions',
      passed: false,
      detail: 'No pending proposed actions — demo approval flow cannot run.',
    }
  }

  return { name: 'pending_actions', passed: true, detail: `${n} pending action(s) awaiting review.` }
}

// Assembles a full demo readiness report for an academy.
export async function buildDemoReadinessReport(
  db: SupabaseClient<Database>,
  academyId: string,
  demoPlayerId?: string,
): Promise<DemoReadinessReport> {
  const checkPromises: Promise<DemoCheck>[] = [
    checkAcademyHasSessionData(db, academyId),
    checkAcademyHasTemplates(db, academyId),
    checkParentSafeSummariesExist(db, academyId),
    checkProgressDataExists(db, academyId),
    checkPendingActionsExist(db, academyId),
  ]

  if (demoPlayerId) {
    checkPromises.push(checkPlayerHasRequiredData(db, demoPlayerId, academyId))
  }

  const checks = await Promise.all(checkPromises)
  const passCount = checks.filter(c => c.passed).length
  const failCount = checks.length - passCount

  return {
    academyId,
    generatedAt: new Date().toISOString(),
    overallReady: failCount === 0,
    passCount,
    failCount,
    checks,
  }
}

// Pure: formats a readiness report for human-readable display.
export function formatReadinessReport(report: DemoReadinessReport): string {
  const status = report.overallReady ? '✓ READY' : '✗ NOT READY'
  const lines = [
    `Demo Readiness — ${status} (${report.passCount}/${report.checks.length} checks passed)`,
    '',
  ]
  for (const check of report.checks) {
    const icon = check.passed ? '  ✓' : '  ✗'
    lines.push(`${icon} ${check.name}: ${check.detail}`)
  }
  return lines.join('\n')
}
