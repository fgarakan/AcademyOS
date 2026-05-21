// Sprint 429 — Curriculum Progress Data Layer V1
// Typed query helpers for player curriculum progress in the director view.
// No select('*'). Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface PlayerProgressSummary {
  playerId: string
  currentLevelId: string | null
  currentLevelLabel: string | null
  requirementCount: number
  completedCount: number
  inProgressCount: number
  completionPct: number
}

export interface LevelProgressRecord {
  playerId: string
  levelId: string
  levelLabel: string
  levelNumber: number
  completedRequirements: number
  totalRequirements: number
  completionPct: number
}

// Fetch academy levels for a given academy.
export async function fetchAcademyLevels(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<Database['public']['Tables']['academy_levels']['Row'][]> {
  const { data, error } = await db
    .from('academy_levels')
    .select('id, label, level_number, sort_order, is_active, track, description, academy_id, created_at, max_age, min_age')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}

// Fetch curriculum progress for a single player.
export async function fetchPlayerCurriculumProgress(
  db: SupabaseClient<Database>,
  academyId: string,
  playerId: string,
): Promise<{
  status: string
  requirementId: string
  curriculumLevelId: string
  progressValue: number | null
  evidenceCount: number
  lastEvidenceAt: string | null
}[]> {
  const { data, error } = await db
    .from('player_requirement_progress')
    .select('status, requirement_id, curriculum_level_id, progress_value, evidence_count, last_evidence_at')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .order('curriculum_level_id', { ascending: true })

  if (error) return []
  return (data ?? []).map(row => ({
    status: row.status,
    requirementId: row.requirement_id,
    curriculumLevelId: row.curriculum_level_id,
    progressValue: row.progress_value,
    evidenceCount: row.evidence_count,
    lastEvidenceAt: row.last_evidence_at,
  }))
}

// Fetch players who are closest to advancing to the next level.
export interface PlayerLevelReadinessSummary {
  playerId: string
  currentLevelId: string | null
  completedCount: number
  totalCount: number
  completionPct: number
}

export async function fetchPlayersNearingLevelAdvancement(
  db: SupabaseClient<Database>,
  academyId: string,
  completionThresholdPct = 80,
  limit = 20,
): Promise<PlayerLevelReadinessSummary[]> {
  // Get all active players with their level
  const { data: players, error: playersError } = await db
    .from('players')
    .select('id, current_level_id')
    .eq('academy_id', academyId)
    .eq('is_active', true)

  if (playersError || !players) return []

  // Get progress for these players
  const playerIds = players.map(p => p.id)
  if (playerIds.length === 0) return []

  const { data: progress, error: progressError } = await db
    .from('player_requirement_progress')
    .select('player_id, status')
    .eq('academy_id', academyId)
    .in('player_id', playerIds)

  if (progressError) return []

  // Compute completion per player
  const playerTotals = new Map<string, { completed: number; total: number }>()
  for (const row of progress ?? []) {
    const current = playerTotals.get(row.player_id) ?? { completed: 0, total: 0 }
    current.total += 1
    if (row.status === 'completed' || row.status === 'confirmed') {
      current.completed += 1
    }
    playerTotals.set(row.player_id, current)
  }

  const summaries: PlayerLevelReadinessSummary[] = players
    .map(player => {
      const totals = playerTotals.get(player.id) ?? { completed: 0, total: 0 }
      const pct = totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0
      return {
        playerId: player.id,
        currentLevelId: player.current_level_id,
        completedCount: totals.completed,
        totalCount: totals.total,
        completionPct: pct,
      }
    })
    .filter(s => s.completionPct >= completionThresholdPct && s.totalCount > 0)
    .sort((a, b) => b.completionPct - a.completionPct)
    .slice(0, limit)

  return summaries
}
