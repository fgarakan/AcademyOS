// Sprint 447 — Player Evidence Data Layer V1
// Query helpers for player_requirement_progress and requirement_evidence_links.
// Visibility-gated: is_player_visible and is_parent_safe flags must be respected.
// No writes. No AI calls. Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface RequirementProgressRecord {
  id: string
  playerId: string
  academyId: string
  requirementId: string
  curriculumLevelId: string
  status: string
  progressValue: number | null
  evidenceCount: number
  isParentVisible: boolean
  isPlayerVisible: boolean
  coachConfirmedBy: string | null
  directorConfirmedBy: string | null
  confirmedAt: string | null
  lastEvidenceAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface EvidenceLinkRecord {
  id: string
  playerId: string
  academyId: string
  requirementId: string
  evidenceId: string
  evidenceType: string
  evidenceSummary: string | null
  confidence: number | null
  weight: number | null
  isParentSafe: boolean
  playerRequirementProgressId: string | null
  gateId: string | null
  createdBy: string | null
  createdAt: string
}

export interface ProgressStatusSummary {
  total: number
  notStarted: number
  inProgress: number
  achieved: number
  confirmed: number
}

function mapProgressRow(
  row: Database['public']['Tables']['player_requirement_progress']['Row'],
): RequirementProgressRecord {
  return {
    id: row.id,
    playerId: row.player_id,
    academyId: row.academy_id,
    requirementId: row.requirement_id,
    curriculumLevelId: row.curriculum_level_id,
    status: row.status,
    progressValue: row.progress_value,
    evidenceCount: row.evidence_count,
    isParentVisible: row.is_parent_visible,
    isPlayerVisible: row.is_player_visible,
    coachConfirmedBy: row.coach_confirmed_by,
    directorConfirmedBy: row.director_confirmed_by,
    confirmedAt: row.confirmed_at,
    lastEvidenceAt: row.last_evidence_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEvidenceRow(
  row: Database['public']['Tables']['requirement_evidence_links']['Row'],
): EvidenceLinkRecord {
  return {
    id: row.id,
    playerId: row.player_id,
    academyId: row.academy_id,
    requirementId: row.requirement_id,
    evidenceId: row.evidence_id,
    evidenceType: row.evidence_type,
    evidenceSummary: row.evidence_summary,
    confidence: row.confidence,
    weight: row.weight,
    isParentSafe: row.is_parent_safe,
    playerRequirementProgressId: row.player_requirement_progress_id,
    gateId: row.gate_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

// All requirement progress records for a player — coach/director view (no visibility filter).
export async function fetchPlayerRequirementProgress(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<RequirementProgressRecord[]> {
  const { data, error } = await db
    .from('player_requirement_progress')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapProgressRow)
}

// Player-visible progress only (is_player_visible = true).
export async function fetchPlayerVisibleProgress(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<RequirementProgressRecord[]> {
  const { data, error } = await db
    .from('player_requirement_progress')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('is_player_visible', true)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapProgressRow)
}

// Parent-visible progress only (is_parent_visible = true).
export async function fetchParentVisibleProgress(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<RequirementProgressRecord[]> {
  const { data, error } = await db
    .from('player_requirement_progress')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('is_parent_visible', true)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapProgressRow)
}

// Evidence links for a player. Optionally scoped to a specific requirement.
export async function fetchRequirementEvidenceLinks(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
  requirementId?: string,
): Promise<EvidenceLinkRecord[]> {
  let query = db
    .from('requirement_evidence_links')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)

  if (requirementId) {
    query = query.eq('requirement_id', requirementId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapEvidenceRow)
}

// Parent-safe evidence links only (is_parent_safe = true).
export async function fetchParentSafeEvidenceLinks(
  db: SupabaseClient<Database>,
  playerId: string,
  academyId: string,
): Promise<EvidenceLinkRecord[]> {
  const { data, error } = await db
    .from('requirement_evidence_links')
    .select('*')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('is_parent_safe', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapEvidenceRow)
}

// Pure: count evidence per requirement from pre-fetched links.
export function countEvidenceByRequirement(
  links: EvidenceLinkRecord[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const link of links) {
    counts[link.requirementId] = (counts[link.requirementId] ?? 0) + 1
  }
  return counts
}

// Pure: summarize progress records by status bucket.
export function summarizeProgressByStatus(
  records: RequirementProgressRecord[],
): ProgressStatusSummary {
  const summary: ProgressStatusSummary = {
    total: records.length,
    notStarted: 0,
    inProgress: 0,
    achieved: 0,
    confirmed: 0,
  }

  for (const r of records) {
    if (r.status === 'not_started') summary.notStarted++
    else if (r.status === 'in_progress') summary.inProgress++
    else if (r.status === 'met') summary.achieved++
    else if (r.status === 'waived') summary.confirmed++
  }

  return summary
}
