// Sprint 450 — Parent Portal Data Layer V1
// Assembles data for the parent's portal view of their child's progress.
// Visibility-gated: is_parent_visible=true, is_parent_safe=true, show_to_parent=true.
// Parents must never see coach-internal notes, raw signals, or unflagged evidence.
// No writes. No AI calls. Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  fetchParentVisibleProgress,
  fetchParentSafeEvidenceLinks,
  summarizeProgressByStatus,
  type RequirementProgressRecord,
  type EvidenceLinkRecord,
  type ProgressStatusSummary,
} from '../player/evidenceQueries'
import {
  fetchPlayerSummaryForParent,
  fetchTopPlayerPriorities,
  getParentFacingContent,
  type DevelopmentSummaryRecord,
  type PlayerPriorityRecord,
} from '../player/developmentProfileQueries'

export interface ParentPortalPlayerCard {
  playerId: string
  academyId: string
  fullName: string | null
  levelLabel: string | null
  groupName: string | null
  coachName: string | null
  currentTrack: string | null
  nextAssessmentDue: string | null
}

export interface ParentPortalProfile {
  playerCard: ParentPortalPlayerCard
  developmentContent: {
    text: string | null
    strengths: string[]
    focus: string | null
  } | null
  topPriorities: PlayerPriorityRecord[]
  progressSummary: ProgressStatusSummary
  parentVisibleProgress: RequirementProgressRecord[]
  parentSafeEvidence: EvidenceLinkRecord[]
  hasDevelopmentSummary: boolean
}

// Fetches a parent-safe player card from the players table.
// Only includes fields that are safe for parent visibility.
export async function fetchParentPortalPlayerCard(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<ParentPortalPlayerCard | null> {
  const { data, error } = await db
    .from('players')
    .select('id, first_name, last_name, full_name, academy_id, current_track, next_assessment_due, current_group_id, current_level_id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  // Resolve group and level names — tolerates missing joins.
  const [groupResult, levelResult] = await Promise.all([
    data.current_group_id
      ? db
          .from('groups')
          .select('name')
          .eq('id', data.current_group_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    data.current_level_id
      ? db
          .from('curriculum_levels')
          .select('display_name')
          .eq('id', data.current_level_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const groupName =
    (groupResult.data as { name: string } | null)?.name ?? null

  const levelLabel =
    (levelResult.data as { display_name: string } | null)?.display_name ?? null

  return {
    playerId: data.id,
    academyId: data.academy_id,
    fullName: data.full_name ?? `${data.first_name} ${data.last_name}`,
    levelLabel,
    groupName,
    coachName: null, // Resolved separately if needed; not included by default
    currentTrack: data.current_track,
    nextAssessmentDue: data.next_assessment_due,
  }
}

// Full parent portal profile — assembles all visibility-gated data in parallel.
export async function fetchParentPortalProfile(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<ParentPortalProfile | null> {
  const [playerCard, developmentSummary, topPriorities, parentVisibleProgress, parentSafeEvidence] =
    await Promise.all([
      fetchParentPortalPlayerCard(db, playerId, academyId),
      fetchPlayerSummaryForParent(db, playerId, academyId),
      fetchTopPlayerPriorities(db, playerId, academyId, 3),
      fetchParentVisibleProgress(db, playerId, academyId),
      fetchParentSafeEvidenceLinks(db, playerId, academyId),
    ])

  if (!playerCard) return null

  const developmentContent = getParentFacingContent(developmentSummary)

  return {
    playerCard,
    developmentContent,
    topPriorities,
    progressSummary: summarizeProgressByStatus(parentVisibleProgress),
    parentVisibleProgress,
    parentSafeEvidence,
    hasDevelopmentSummary: developmentSummary !== null && developmentSummary.showToParent,
  }
}

// Parent-visible progress only.
export async function fetchParentPortalProgress(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<RequirementProgressRecord[]> {
  return fetchParentVisibleProgress(db, playerId, academyId)
}

// Parent-facing development summary. Returns null if not cleared for parent.
export async function fetchParentPortalDevelopmentSummary(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<DevelopmentSummaryRecord | null> {
  return fetchPlayerSummaryForParent(db, playerId, academyId)
}

// Pure: checks whether the parent portal has enough data to render meaningfully.
export function isParentPortalReady(profile: ParentPortalProfile | null): boolean {
  if (!profile) return false
  return (
    profile.playerCard.fullName !== null ||
    profile.parentVisibleProgress.length > 0 ||
    profile.hasDevelopmentSummary
  )
}

// Pure: checks whether the parent can see any development content.
export function parentCanSeeDevelopmentContent(
  profile: ParentPortalProfile | null,
): boolean {
  return profile !== null && profile.developmentContent !== null
}
