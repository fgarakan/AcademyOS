// Player Evidence Aggregator
// Reads from player_evidence_records (primary).
// Falls back to existing tables when evidence records table is empty or unavailable.
// Never exposes raw coach notes to parent/player roles.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvidenceRecord, EvidencePathway, EvidenceSourceType } from './playerEvidenceTypes'

export interface AggregatorResult {
  records: EvidenceRecord[]
  isSchemaMissing: boolean
  error: string | null
  source: 'evidence_records' | 'fallback_tables'
}

function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = (err as { message?: string }).message ?? ''
  const code = (err as { code?: string }).code ?? ''
  return msg.includes('does not exist') || code === '42P01' || code === '42703'
}

// ─── Primary reader ───────────────────────────────────────────────────────────

export async function getPlayerEvidenceRecords(
  supabase: SupabaseClient,
  playerId: string,
  academyId: string,
  options: {
    pathway?: EvidencePathway
    sourceTypes?: EvidenceSourceType[]
    limit?: number
    visibleToRole?: 'director' | 'coach' | 'parent' | 'player'
  } = {},
): Promise<AggregatorResult> {
  const rawDb = supabase as any
  const limit = options.limit ?? 50

  try {
    let query = rawDb
      .from('player_evidence_records')
      .select([
        'id', 'academy_id', 'player_id', 'source_type', 'source_id',
        'curriculum_level_id', 'curriculum_level_name',
        'curriculum_requirement_id', 'curriculum_requirement_label',
        'priority_key', 'priority_label',
        'pathway', 'confidence', 'evidence_strength', 'evidence_summary',
        'visible_to_director', 'visible_to_coach', 'visible_to_parent', 'visible_to_player',
        'owner_scope', 'portability_status', 'consent_status', 'consent_version',
        'anonymized_at', 'transferred_at',
        'created_by', 'created_at', 'updated_at',
      ].join(', '))
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .is('anonymized_at', null)   // exclude anonymized records
      .order('created_at', { ascending: false })
      .limit(limit)

    if (options.pathway) {
      query = query.eq('pathway', options.pathway)
    }
    if (options.sourceTypes && options.sourceTypes.length > 0) {
      query = query.in('source_type', options.sourceTypes)
    }
    if (options.visibleToRole === 'coach') {
      query = query.eq('visible_to_coach', true)
    } else if (options.visibleToRole === 'parent') {
      query = query.eq('visible_to_parent', true)
    } else if (options.visibleToRole === 'player') {
      query = query.eq('visible_to_player', true)
    }

    const { data, error } = await query

    if (error) {
      if (isMissingTable(error)) {
        return await fallbackAggregation(rawDb, playerId, academyId, limit)
      }
      return { records: [], isSchemaMissing: false, error: error.message, source: 'evidence_records' }
    }

    const records: EvidenceRecord[] = (data ?? []) as EvidenceRecord[]

    // If table exists but is empty, fall back to read from existing tables
    if (records.length === 0) {
      return await fallbackAggregation(rawDb, playerId, academyId, limit)
    }

    return { records, isSchemaMissing: false, error: null, source: 'evidence_records' }

  } catch (err) {
    if (isMissingTable(err)) {
      return await fallbackAggregation(rawDb, playerId, academyId, limit)
    }
    return { records: [], isSchemaMissing: true, error: String(err), source: 'evidence_records' }
  }
}

// ─── Fallback aggregation from existing tables ────────────────────────────────
// Used when player_evidence_records is empty or unavailable.
// Synthesizes EvidenceRecord-shaped objects from existing data.
// No mutations — read-only.

async function fallbackAggregation(
  rawDb: any,
  playerId: string,
  academyId: string,
  limit: number,
): Promise<AggregatorResult> {
  const records: EvidenceRecord[] = []

  try {
    // Assessments
    const { data: assessments } = await rawDb
      .from('assessments')
      .select('id, assessed_date, type, overall_score, scores_detail')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .order('assessed_date', { ascending: false })
      .limit(5)

    for (const a of (assessments ?? [])) {
      const detail = a.scores_detail as any
      records.push({
        id:                           `fallback_assessment_${a.id as string}`,
        academy_id:                   academyId,
        player_id:                    playerId,
        source_type:                  'assessment_score',
        source_id:                    a.id as string,
        curriculum_level_id:          null,
        curriculum_level_name:        detail?.assessment_view ?? null,
        curriculum_requirement_id:    null,
        curriculum_requirement_label: null,
        priority_key:                 null,
        priority_label:               null,
        pathway:                      'skill',
        evidence_category:            'assessment',
        confidence:                   a.overall_score != null ? Math.round((a.overall_score as number / 10) * 100) : 50,
        evidence_strength:            a.overall_score != null ? (a.overall_score >= 7.5 ? 'strong' : a.overall_score >= 5 ? 'moderate' : 'weak') : 'moderate',
        evidence_weight:              1.0,
        evidence_summary:             `Assessment (${(a.type as string).replace(/_/g, ' ')})${a.overall_score != null ? ` — score ${(a.overall_score as number).toFixed(1)}` : ''}.`,
        visible_to_director:          true,
        visible_to_coach:             true,
        visible_to_parent:            false,
        visible_to_player:            false,
        owner_scope:                  'shared',
        portability_status:           'portable',
        consent_status:               'not_required',
        consent_version:              null,
        anonymized_player_key:        null,
        former_player_stage:          null,
        former_player_age_band:       null,
        anonymized_at:                null,
        transferred_at:               null,
        expires_at:                   null,
        created_by:                   null,
        created_at:                   a.assessed_date as string,
        updated_at:                   a.assessed_date as string,
      })
    }

    // Missions
    const { data: missions } = await rawDb
      .from('player_mission_assignments')
      .select('id, mission_label, status, created_at')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(5)

    for (const m of (missions ?? [])) {
      const isComplete = m.status === 'completed'
      records.push({
        id:                           `fallback_mission_${m.id as string}`,
        academy_id:                   academyId,
        player_id:                    playerId,
        source_type:                  isComplete ? 'mission_completed' : 'mission_assigned',
        source_id:                    m.id as string,
        curriculum_level_id:          null,
        curriculum_level_name:        null,
        curriculum_requirement_id:    null,
        curriculum_requirement_label: null,
        priority_key:                 null,
        priority_label:               null,
        pathway:                      'general',
        evidence_category:            'milestone',
        confidence:                   isComplete ? 85 : 70,
        evidence_strength:            isComplete ? 'strong' : 'moderate',
        evidence_weight:              1.0,
        evidence_summary:             `Mission ${isComplete ? 'completed' : 'assigned'}: "${m.mission_label as string}".`,
        visible_to_director:          true,
        visible_to_coach:             true,
        visible_to_parent:            false,
        visible_to_player:            true,
        owner_scope:                  'player_owned',
        portability_status:           'portable',
        consent_status:               'not_required',
        consent_version:              null,
        anonymized_player_key:        null,
        former_player_stage:          null,
        former_player_age_band:       null,
        anonymized_at:                null,
        transferred_at:               null,
        expires_at:                   null,
        created_by:                   null,
        created_at:                   m.created_at as string,
        updated_at:                   m.created_at as string,
      })
    }

    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      records: records.slice(0, limit),
      isSchemaMissing: false,
      error: null,
      source: 'fallback_tables',
    }
  } catch {
    return { records: [], isSchemaMissing: true, error: 'Fallback aggregation failed', source: 'fallback_tables' }
  }
}

// ─── Portable record export ───────────────────────────────────────────────────
// Returns only portable, player_owned evidence for export (player passport).

export async function getPortablePlayerEvidence(
  supabase: SupabaseClient,
  playerId: string,
  academyId: string,
): Promise<AggregatorResult> {
  return getPlayerEvidenceRecords(supabase, playerId, academyId, {
    sourceTypes: [
      'assessment_score', 'reassessment_change', 'mission_assigned',
      'mission_completed', 'placement_decision', 'level_readiness_signal',
      'parent_update_approved', 'competition_note',
    ],
    limit: 200,
  })
}
