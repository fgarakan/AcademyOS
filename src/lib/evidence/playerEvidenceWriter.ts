// Player Evidence Writer
// Single write path for all player_evidence_records inserts.
// Called from server actions after meaningful player events.
// All writes are non-blocking (caller uses try/catch).
// Deduplicates on (player_id, source_type, source_id) via DB unique index.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvidenceWriteInput } from './playerEvidenceTypes'
import { EVIDENCE_OWNERSHIP } from './playerEvidenceTypes'

export interface EvidenceWriteResult {
  ok: boolean
  evidenceId: string | null
  error: string | null
  isDuplicate: boolean
}

export async function writeEvidenceRecord(
  supabase: SupabaseClient,
  input: EvidenceWriteInput,
): Promise<EvidenceWriteResult> {
  const rawDb = supabase as any
  const ownership = EVIDENCE_OWNERSHIP[input.sourceType]

  const record = {
    academy_id:                    input.academyId,
    player_id:                     input.playerId,
    source_type:                   input.sourceType,
    source_id:                     input.sourceId,
    pathway:                       input.pathway ?? null,
    curriculum_level_id:           input.curriculumLevelId ?? null,
    curriculum_level_name:         input.curriculumLevelName ?? null,
    curriculum_requirement_id:     input.curriculumRequirementId ?? null,
    curriculum_requirement_label:  input.curriculumRequirementLabel ?? null,
    priority_key:                  input.priorityKey ?? null,
    priority_label:                input.priorityLabel ?? null,
    confidence:                    input.confidence ?? 60,
    evidence_strength:             input.evidenceStrength ?? 'moderate',
    evidence_summary:              input.evidenceSummary,
    evidence_category:             input.evidenceCategory ?? null,
    evidence_weight:               input.evidenceWeight ?? 1.0,
    expires_at:                    input.expiresAt ?? null,
    visible_to_director:           true,
    visible_to_coach:              input.visibleToCoach ?? ownership.defaultVisibleToCoach,
    visible_to_parent:             input.visibleToParent ?? ownership.defaultVisibleToParent,
    visible_to_player:             input.visibleToPlayer ?? ownership.defaultVisibleToPlayer,
    owner_scope:                   ownership.ownerScope,
    portability_status:            ownership.portabilityStatus,
    consent_status:                ownership.consentStatus,
    consent_version:               null,
    created_by:                    input.createdBy ?? null,
  }

  const { data, error } = await rawDb
    .from('player_evidence_records')
    .insert(record)
    .select('id')
    .single()

  if (error) {
    // Unique constraint violation = duplicate; treat as non-error
    const isDuplicate =
      error.code === '23505' ||
      (error.message as string ?? '').includes('duplicate') ||
      (error.message as string ?? '').includes('unique')

    if (isDuplicate) {
      return { ok: true, evidenceId: null, error: null, isDuplicate: true }
    }
    return { ok: false, evidenceId: null, error: error.message, isDuplicate: false }
  }

  return { ok: true, evidenceId: data?.id ?? null, error: null, isDuplicate: false }
}

// ─── Convenience wrappers for common event types ──────────────────────────────

export async function writeAssessmentEvidence(
  supabase: SupabaseClient,
  params: {
    academyId: string
    playerId: string
    assessmentId: string
    overallScore: number | null
    assessmentLabel: string
    assessmentView: string
    curriculumLevelId: string | null
    curriculumLevelName: string | null
    createdBy: string
  },
): Promise<void> {
  const summary = params.overallScore !== null
    ? `${params.assessmentLabel.replace(/_/g, ' ')} recorded. Overall score: ${params.overallScore.toFixed(1)}/10. View: ${params.assessmentView.replace(/_/g, ' ')}.`
    : `${params.assessmentLabel.replace(/_/g, ' ')} recorded. View: ${params.assessmentView.replace(/_/g, ' ')}.`

  await writeEvidenceRecord(supabase, {
    academyId:          params.academyId,
    playerId:           params.playerId,
    sourceType:         'assessment_score',
    sourceId:           params.assessmentId,
    pathway:            'skill',
    curriculumLevelId:  params.curriculumLevelId,
    curriculumLevelName: params.curriculumLevelName,
    confidence:         params.overallScore !== null ? Math.round((params.overallScore / 10) * 100) : 50,
    evidenceStrength:   params.overallScore !== null
      ? (params.overallScore >= 7.5 ? 'strong' : params.overallScore >= 5 ? 'moderate' : 'weak')
      : 'moderate',
    evidenceSummary:    summary,
    createdBy:          params.createdBy,
  })
}

export async function writeReassessmentEvidence(
  supabase: SupabaseClient,
  params: {
    academyId: string
    playerId: string
    assessmentId: string
    overallDelta: number | null
    improvedCount: number
    declinedCount: number
    curriculumLevelId: string | null
    curriculumLevelName: string | null
    createdBy: string
  },
): Promise<void> {
  const { overallDelta, improvedCount, declinedCount } = params
  const directionWord = overallDelta === null ? 'unchanged'
    : overallDelta > 0 ? `improved by ${overallDelta.toFixed(1)}`
    : overallDelta < 0 ? `declined by ${Math.abs(overallDelta).toFixed(1)}`
    : 'stable'

  const summary = `Reassessment: overall ${directionWord}. ${improvedCount} domain${improvedCount !== 1 ? 's' : ''} improved, ${declinedCount} declined.`

  await writeEvidenceRecord(supabase, {
    academyId:          params.academyId,
    playerId:           params.playerId,
    sourceType:         'reassessment_change',
    sourceId:           params.assessmentId,
    pathway:            'skill',
    curriculumLevelId:  params.curriculumLevelId,
    curriculumLevelName: params.curriculumLevelName,
    confidence:         overallDelta !== null && Math.abs(overallDelta) >= 1 ? 80 : 60,
    evidenceStrength:   overallDelta !== null && Math.abs(overallDelta) >= 1.5 ? 'strong' : 'moderate',
    evidenceSummary:    summary,
    createdBy:          params.createdBy,
  })
}

export async function writeMissionAssignedEvidence(
  supabase: SupabaseClient,
  params: {
    academyId: string
    playerId: string
    missionId: string
    missionLabel: string
    curriculumLevelId: string | null
    priorityKey: string | null
    priorityLabel: string | null
    createdBy: string
  },
): Promise<void> {
  await writeEvidenceRecord(supabase, {
    academyId:     params.academyId,
    playerId:      params.playerId,
    sourceType:    'mission_assigned',
    sourceId:      params.missionId,
    pathway:       'general',
    priorityKey:   params.priorityKey,
    priorityLabel: params.priorityLabel,
    curriculumLevelId: params.curriculumLevelId,
    confidence:    70,
    evidenceStrength: 'moderate',
    evidenceSummary: `Mission assigned: "${params.missionLabel}".`,
    visibleToPlayer: true,
    createdBy:     params.createdBy,
  })
}

export async function writeMissionCompletedEvidence(
  supabase: SupabaseClient,
  params: {
    academyId: string
    playerId: string
    missionId: string
    missionLabel: string
    completionNote: string | null
    createdBy: string
  },
): Promise<void> {
  const summary = `Mission completed: "${params.missionLabel}".${params.completionNote ? ' ' + params.completionNote : ''}`
  await writeEvidenceRecord(supabase, {
    academyId:        params.academyId,
    playerId:         params.playerId,
    sourceType:       'mission_completed',
    sourceId:         params.missionId,
    pathway:          'general',
    confidence:       85,
    evidenceStrength: 'strong',
    evidenceSummary:  summary,
    visibleToPlayer:  true,
    createdBy:        params.createdBy,
  })
}

export async function writePlacementDecisionEvidence(
  supabase: SupabaseClient,
  params: {
    academyId: string
    playerId: string
    recommendationId: string
    decision: 'accepted' | 'overridden' | 'trial' | 'deferred'
    levelName: string | null
    groupName: string | null
    isOverride: boolean
    createdBy: string
  },
): Promise<void> {
  // Override details are academy_owned/internal_only — write separate record
  if (params.isOverride) {
    await writeEvidenceRecord(supabase, {
      academyId:        params.academyId,
      playerId:         params.playerId,
      sourceType:       'director_override',
      sourceId:         params.recommendationId + '_override',
      pathway:          'general',
      confidence:       90,
      evidenceStrength: 'strong',
      evidenceSummary:  `Director override applied. Decision: ${params.decision}.`,
      visibleToCoach:   false,
      createdBy:        params.createdBy,
    })
  }

  const levelDesc = params.levelName ? ` Level: ${params.levelName}.` : ''
  const groupDesc = params.groupName ? ` Group: ${params.groupName}.` : ''
  await writeEvidenceRecord(supabase, {
    academyId:        params.academyId,
    playerId:         params.playerId,
    sourceType:       'placement_decision',
    sourceId:         params.recommendationId,
    pathway:          'general',
    confidence:       90,
    evidenceStrength: 'strong',
    evidenceSummary:  `Placement ${params.decision}.${levelDesc}${groupDesc}`,
    createdBy:        params.createdBy,
  })
}
