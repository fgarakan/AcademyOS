// Assessment Evidence Writer V1
// Drop-in upgrade over writeAssessmentEvidence / writeReassessmentEvidence.
// Writes summary + section-level evidence records (non-blocking on failure).
// All records default to visible_to_director=true, visible_to_coach=true,
// visible_to_parent=false, visible_to_player=false.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScoresDetail } from '@/lib/assessment/assessmentTemplateTypes'
import type { AssessmentPurpose } from '@/lib/assessment/assessmentTemplateResolver'
import { writeEvidenceRecord } from './playerEvidenceWriter'
import {
  mapAssessmentToEvidenceRecords,
  mapQuickAssessmentToEvidence,
  type QuickAssessmentEvidenceMappingInput,
} from './assessmentEvidenceMapper'

// ─── Full assessment writer ───────────────────────────────────────────────────

export interface WriteFullAssessmentEvidenceParams {
  academyId:           string
  playerId:            string
  assessmentId:        string
  scoresDetail:        ScoresDetail
  assessmentPurpose:   AssessmentPurpose
  assessmentLabel:     string
  assessmentView:      string
  overallScore:        number | null
  curriculumLevelId:   string | null
  curriculumLevelName: string | null
  createdBy:           string
  isReassessment:      boolean
}

export async function writeFullAssessmentEvidence(
  supabase: SupabaseClient,
  params: WriteFullAssessmentEvidenceParams,
): Promise<void> {
  const mapping = mapAssessmentToEvidenceRecords({
    academyId:           params.academyId,
    playerId:            params.playerId,
    assessmentId:        params.assessmentId,
    scoresDetail:        params.scoresDetail,
    assessmentPurpose:   params.assessmentPurpose,
    assessmentLabel:     params.assessmentLabel,
    assessmentView:      params.assessmentView,
    overallScore:        params.overallScore,
    curriculumLevelId:   params.curriculumLevelId,
    curriculumLevelName: params.curriculumLevelName,
    createdBy:           params.createdBy,
    isReassessment:      params.isReassessment,
  })

  // Write summary record
  await writeEvidenceRecord(supabase, mapping.summaryRecord)

  // Write section records sequentially (non-blocking — caller wraps in try/catch)
  for (const sectionRecord of mapping.sectionRecords) {
    try {
      await writeEvidenceRecord(supabase, sectionRecord)
    } catch {
      // Section-level writes are best-effort; summary record is authoritative
    }
  }
}

// ─── Quick assessment writer (no ScoresDetail) ───────────────────────────────

export async function writeQuickAssessmentEvidence(
  supabase: SupabaseClient,
  params: QuickAssessmentEvidenceMappingInput,
): Promise<void> {
  const record = mapQuickAssessmentToEvidence(params)
  await writeEvidenceRecord(supabase, record)
}
