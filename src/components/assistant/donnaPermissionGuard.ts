// Donna Permission Guard — Sprint 280
// Pure TypeScript only. No DB, no Supabase, no async, no AI.
//
// Given a task ID and the current user's role, returns whether the task is
// allowed and a human-readable reason if it is blocked.
//
// Use at render time to gate Donna task buttons and as safety documentation.
// Mirrors the server-side role checks in donnaDirectorIntelligenceActions.ts
// so the UI gives honest feedback before a server round-trip.

import type { DonnaTaskId } from './donnaTaskContracts'

export type DonnaRoleContext = 'academy_director' | 'head_coach' | 'coach' | string

export interface DonnaPermissionCheckResult {
  allowed: boolean
  blockedReason: string | null
}

// Tasks that only academy directors may propose.
// Head coaches and coaches are blocked from these regardless of context.
const DIRECTOR_ONLY_TASKS = new Set<DonnaTaskId>([
  'draft_parent_update',
  'review_level_readiness',
  'adjust_curriculum',
  'create_group',
])

// Tasks that head coaches may also propose in addition to directors.
const HEAD_COACH_ALLOWED_TASKS = new Set<DonnaTaskId>([
  'create_class_template',
  'create_fitness_template',
  'create_session',
  'populate_session_from_template',
  'capture_coach_note',
  'draft_player_note',
  'handle_attendance_exception',
  'recommend_template_for_group',
  'draft_coach_communication',
])

export function checkDonnaTaskPermission(
  taskId: DonnaTaskId,
  role: DonnaRoleContext,
): DonnaPermissionCheckResult {
  if (role === 'academy_director') {
    return { allowed: true, blockedReason: null }
  }

  if (role === 'head_coach') {
    if (DIRECTOR_ONLY_TASKS.has(taskId)) {
      return {
        allowed: false,
        blockedReason: 'This task is restricted to academy directors.',
      }
    }
    if (HEAD_COACH_ALLOWED_TASKS.has(taskId)) {
      return { allowed: true, blockedReason: null }
    }
    return {
      allowed: false,
      blockedReason: 'This task is not available for your role.',
    }
  }

  return {
    allowed: false,
    blockedReason: 'Only directors and head coaches can use Donna to propose changes.',
  }
}

// Returns a short label for the role, safe for display.
export function describeDonnaRole(role: DonnaRoleContext): string {
  if (role === 'academy_director') return 'Academy Director'
  if (role === 'head_coach') return 'Head Coach'
  if (role === 'coach') return 'Coach'
  return 'Unknown role'
}
