// Sprint 448 — Player Development Profile Data Helpers V1
// Query helpers for player_development_summary and player_priorities.
// Visibility-gated: show_to_parent / show_to_student flags must be respected.
// These records are in the no-cache zone — always fetched real-time.
// No writes. No AI calls. Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface DevelopmentSummaryRecord {
  id: string
  playerId: string
  academyId: string
  coachSummary: string | null
  parentSummary: string | null
  studentFriendlySummary: string | null
  currentStrengths: string[]
  thingsToWorkOn: string[]
  developmentFocus: string | null
  showToParent: boolean
  showToStudent: boolean
  source: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string | null
}

export interface PlayerPriorityRecord {
  id: string
  playerId: string
  academyId: string
  title: string
  description: string | null
  category: Database['public']['Enums']['priority_category']
  priorityRank: number
  priorityLevel: string
  confidenceScore: number
  currentScore: number | null
  targetScore: number | null
  urgency: string
  status: string
  isActive: boolean
  relevantDimension: string | null
  minSessionsPerWeek: number | null
  suggestedExerciseTags: string[] | null
  generatedAt: string
  updatedAt: string
}

function mapSummaryRow(
  row: Database['public']['Tables']['player_development_summary']['Row'],
): DevelopmentSummaryRecord {
  return {
    id: row.id,
    playerId: row.player_id,
    academyId: row.academy_id,
    coachSummary: row.coach_summary,
    parentSummary: row.parent_summary,
    studentFriendlySummary: row.student_friendly_summary,
    currentStrengths: row.current_strengths,
    thingsToWorkOn: row.things_to_work_on,
    developmentFocus: row.development_focus,
    showToParent: row.show_to_parent,
    showToStudent: row.show_to_student,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  }
}

function mapPriorityRow(
  row: Database['public']['Tables']['player_priorities']['Row'],
): PlayerPriorityRecord {
  return {
    id: row.id,
    playerId: row.player_id,
    academyId: row.academy_id,
    title: row.title,
    description: row.description,
    category: row.category,
    priorityRank: row.priority_rank,
    priorityLevel: row.priority_level,
    confidenceScore: row.confidence_score,
    currentScore: row.current_score,
    targetScore: row.target_score,
    urgency: row.urgency,
    status: row.status,
    isActive: row.is_active,
    relevantDimension: row.relevant_dimension,
    minSessionsPerWeek: row.min_sessions_per_week,
    suggestedExerciseTags: row.suggested_exercise_tags,
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
  }
}

// Full summary — coach/director facing. No visibility filter.
export async function fetchPlayerDevelopmentSummary(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<DevelopmentSummaryRecord | null> {
  const { data, error } = await db
    .from('player_development_summary')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return mapSummaryRow(data)
}

// Student-facing summary. Only returned when show_to_student is true.
export async function fetchPlayerSummaryForStudent(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<DevelopmentSummaryRecord | null> {
  const { data, error } = await db
    .from('player_development_summary')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('show_to_student', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return mapSummaryRow(data)
}

// Parent-facing summary. Only returned when show_to_parent is true.
export async function fetchPlayerSummaryForParent(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<DevelopmentSummaryRecord | null> {
  const { data, error } = await db
    .from('player_development_summary')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('show_to_parent', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return mapSummaryRow(data)
}

// Active priorities for a player, ordered by priority_rank ascending.
export async function fetchPlayerPriorities(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<PlayerPriorityRecord[]> {
  const { data, error } = await db
    .from('player_priorities')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })

  if (error || !data) return []
  return data.map(mapPriorityRow)
}

// Top N active priorities — used for compact portal views.
export async function fetchTopPlayerPriorities(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
  limit: number = 3,
): Promise<PlayerPriorityRecord[]> {
  const { data, error } = await db
    .from('player_priorities')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })
    .limit(limit)

  if (error || !data) return []
  return data.map(mapPriorityRow)
}

// Pure: guard — returns whether the summary should be shown to the student.
export function isProfileShownToStudent(
  summary: DevelopmentSummaryRecord | null,
): boolean {
  return summary !== null && summary.showToStudent
}

// Pure: guard — returns whether the summary should be shown to the parent.
export function isProfileShownToParent(
  summary: DevelopmentSummaryRecord | null,
): boolean {
  return summary !== null && summary.showToParent
}

// Pure: extracts the student-safe text from a summary.
// Returns null if not visible to student.
export function getStudentFacingContent(
  summary: DevelopmentSummaryRecord | null,
): { text: string | null; strengths: string[]; workOn: string[] } | null {
  if (!isProfileShownToStudent(summary)) return null
  return {
    text: summary!.studentFriendlySummary,
    strengths: summary!.currentStrengths,
    workOn: summary!.thingsToWorkOn,
  }
}

// Pure: extracts the parent-safe text from a summary.
// Returns null if not visible to parent.
export function getParentFacingContent(
  summary: DevelopmentSummaryRecord | null,
): { text: string | null; strengths: string[]; focus: string | null } | null {
  if (!isProfileShownToParent(summary)) return null
  return {
    text: summary!.parentSummary,
    strengths: summary!.currentStrengths,
    focus: summary!.developmentFocus,
  }
}
