// Sprint 449 — Player Portal Data Layer V1
// Assembles data for the player's own portal view.
// Visibility-gated: only is_player_visible=true progress and show_to_student=true summaries.
// No writes. No AI calls. Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  fetchPlayerVisibleProgress,
  summarizeProgressByStatus,
  type RequirementProgressRecord,
  type ProgressStatusSummary,
} from './evidenceQueries'
import {
  fetchPlayerSummaryForStudent,
  fetchTopPlayerPriorities,
  getStudentFacingContent,
  type DevelopmentSummaryRecord,
  type PlayerPriorityRecord,
} from './developmentProfileQueries'

export interface PlayerPortalSummary {
  playerId: string
  academyId: string
  fullName: string | null
  levelLabel: string | null
  levelNumber: number | null
  groupName: string | null
  coachName: string | null
  currentTrack: string | null
  overallScore: number | null
  promotionReady: boolean | null
  nextAssessmentDue: string | null
}

export interface PlayerPortalProfile {
  summary: PlayerPortalSummary
  developmentContent: {
    text: string | null
    strengths: string[]
    workOn: string[]
  } | null
  topPriorities: PlayerPriorityRecord[]
  progressSummary: ProgressStatusSummary
  visibleProgress: RequirementProgressRecord[]
  hasDevelopmentSummary: boolean
}

// Fetches the player's own summary from the v_player_summary view.
export async function fetchPlayerPortalSummary(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<PlayerPortalSummary | null> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const { data, error } = await (rawDb as typeof db)
    .from('v_player_summary')
    .select('player_id, full_name, academy_id, level_label, level_number, group_name, coach_name, current_track, overall_score, promotion_ready, next_assessment_due')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as {
    player_id: string
    full_name: string | null
    academy_id: string | null
    level_label: string | null
    level_number: number | null
    group_name: string | null
    coach_name: string | null
    current_track: string | null
    overall_score: number | null
    promotion_ready: boolean | null
    next_assessment_due: string | null
  }

  return {
    playerId: row.player_id,
    academyId: academyId,
    fullName: row.full_name,
    levelLabel: row.level_label,
    levelNumber: row.level_number,
    groupName: row.group_name,
    coachName: row.coach_name,
    currentTrack: row.current_track,
    overallScore: row.overall_score,
    promotionReady: row.promotion_ready,
    nextAssessmentDue: row.next_assessment_due,
  }
}

// Full player portal profile — assembles all visibility-gated data in parallel.
export async function fetchPlayerPortalProfile(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<PlayerPortalProfile | null> {
  const [summary, developmentSummary, topPriorities, visibleProgress] =
    await Promise.all([
      fetchPlayerPortalSummary(db, playerId, academyId),
      fetchPlayerSummaryForStudent(db, playerId, academyId),
      fetchTopPlayerPriorities(db, playerId, academyId, 3),
      fetchPlayerVisibleProgress(db, playerId, academyId),
    ])

  if (!summary) return null

  const developmentContent = getStudentFacingContent(developmentSummary)

  return {
    summary,
    developmentContent,
    topPriorities,
    progressSummary: summarizeProgressByStatus(visibleProgress),
    visibleProgress,
    hasDevelopmentSummary: developmentSummary !== null && developmentSummary.showToStudent,
  }
}

// Player-visible progress only — used for the player's skill progress view.
export async function fetchPlayerPortalProgress(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<RequirementProgressRecord[]> {
  return fetchPlayerVisibleProgress(db, playerId, academyId)
}

// Player-facing active priorities (top 3 by rank).
export async function fetchPlayerPortalPriorities(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<PlayerPriorityRecord[]> {
  return fetchTopPlayerPriorities(db, playerId, academyId, 3)
}

// Pure: checks whether the player portal has enough data to render meaningfully.
export function isPlayerPortalReady(profile: PlayerPortalProfile | null): boolean {
  if (!profile) return false
  return profile.summary.levelLabel !== null || profile.visibleProgress.length > 0
}
