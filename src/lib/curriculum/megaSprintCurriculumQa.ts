// Sprint 552 — Mega Sprint Curriculum QA
// Quality assurance harness for the full Curriculum Experience + Knowledge Engine
// built across Mega Sprint 503-552.
// Verifies all 50 sprints are represented and doctrine is upheld.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type CurriculumQaCheckId =
  // Phase 1 — Curriculum Experience Core
  | 'command_center'
  | 'visual_map_model'
  | 'expandable_tree'
  | 'node_detail_drawer'
  | 'content_type_model'
  | 'donna_curriculum_context'
  | 'drill_attachment_model'
  | 'skill_hierarchy_model'
  | 'mission_attachment_model'
  | 'badge_attachment_model'
  | 'parent_guidance_attachment'
  | 'coach_cue_library'
  | 'assessment_criteria_model'
  | 'evidence_requirements_model'
  // Phase 2 — Curriculum Coverage Intelligence
  | 'coverage_model'
  | 'gap_analysis'
  | 'domain_balance_checker'
  | 'stage_progression_model'
  | 'level_health_report'
  | 'requirement_progress_aggregator'
  | 'template_connection_model'
  | 'player_curriculum_intersection'
  | 'curriculum_health_dashboard'
  | 'coverage_recommendations'
  // Phase 3 — Knowledge Library
  | 'knowledge_types'
  | 'knowledge_library'
  | 'knowledge_review_queue'
  | 'knowledge_promotion_path'
  | 'knowledge_privacy_guards'
  | 'knowledge_audit_log'
  // Phase 4 — Knowledge Ingestion
  | 'ingestion_classifier'
  | 'voice_ingestion'
  | 'source_validator'
  | 'curriculum_bridge'
  // Phase 5 — Knowledge Retrieval Intelligence
  | 'retrieval_model'
  | 'curriculum_intelligence'
  | 'answerability_model'
  | 'knowledge_qa'
  | 'curriculum_knowledge_view'
  // Doctrine checks
  | 'parent_blocked_from_knowledge'
  | 'player_blocked_from_knowledge'
  | 'no_auto_curriculum_promotion'
  | 'director_approval_all_paths'
  | 'donna_cannot_publish'
  | 'coach_cues_private'
  | 'no_new_migrations'
  | 'no_rls_changes'
  | 'typescript_clean'

export interface CurriculumMegaSprintQaCheck {
  checkId: CurriculumQaCheckId
  label: string
  phase: 1 | 2 | 3 | 4 | 5 | 0
  isBlocker: boolean
}

export interface CurriculumMegaSprintQaResult {
  checkId: CurriculumQaCheckId
  passed: boolean
  note: string | null
}

export interface CurriculumMegaSprintQaReport {
  checks: CurriculumMegaSprintQaResult[]
  totalChecks: number
  passedChecks: number
  failedChecks: number
  blockerFailures: number
  byPhase: Record<0 | 1 | 2 | 3 | 4 | 5, { passed: number; total: number }>
  isComplete: boolean
  summary: string
}

export const CURRICULUM_MEGA_SPRINT_QA_CHECKS: CurriculumMegaSprintQaCheck[] = [
  { checkId: 'command_center', label: 'Curriculum command center', phase: 1, isBlocker: false },
  { checkId: 'visual_map_model', label: 'Visual map model', phase: 1, isBlocker: false },
  { checkId: 'expandable_tree', label: 'Expandable tree', phase: 1, isBlocker: false },
  { checkId: 'node_detail_drawer', label: 'Node detail drawer', phase: 1, isBlocker: false },
  { checkId: 'content_type_model', label: 'Content type model', phase: 1, isBlocker: false },
  { checkId: 'donna_curriculum_context', label: 'DONNA curriculum context', phase: 1, isBlocker: false },
  { checkId: 'drill_attachment_model', label: 'Drill attachment model', phase: 1, isBlocker: false },
  { checkId: 'skill_hierarchy_model', label: 'Skill hierarchy model', phase: 1, isBlocker: false },
  { checkId: 'mission_attachment_model', label: 'Mission attachment model', phase: 1, isBlocker: false },
  { checkId: 'badge_attachment_model', label: 'Badge attachment model', phase: 1, isBlocker: false },
  { checkId: 'parent_guidance_attachment', label: 'Parent guidance attachment', phase: 1, isBlocker: false },
  { checkId: 'coach_cue_library', label: 'Coach cue library', phase: 1, isBlocker: false },
  { checkId: 'assessment_criteria_model', label: 'Assessment criteria model', phase: 1, isBlocker: false },
  { checkId: 'evidence_requirements_model', label: 'Evidence requirements model', phase: 1, isBlocker: false },
  { checkId: 'coverage_model', label: 'Coverage model', phase: 2, isBlocker: true },
  { checkId: 'gap_analysis', label: 'Gap analysis', phase: 2, isBlocker: true },
  { checkId: 'domain_balance_checker', label: 'Domain balance checker', phase: 2, isBlocker: false },
  { checkId: 'stage_progression_model', label: 'Stage progression model', phase: 2, isBlocker: false },
  { checkId: 'level_health_report', label: 'Level health report', phase: 2, isBlocker: true },
  { checkId: 'requirement_progress_aggregator', label: 'Requirement progress aggregator', phase: 2, isBlocker: true },
  { checkId: 'template_connection_model', label: 'Template connection model', phase: 2, isBlocker: false },
  { checkId: 'player_curriculum_intersection', label: 'Player-curriculum intersection', phase: 2, isBlocker: false },
  { checkId: 'curriculum_health_dashboard', label: 'Curriculum health dashboard', phase: 2, isBlocker: true },
  { checkId: 'coverage_recommendations', label: 'Coverage recommendations', phase: 2, isBlocker: false },
  { checkId: 'knowledge_types', label: 'Knowledge types defined', phase: 3, isBlocker: true },
  { checkId: 'knowledge_library', label: 'Knowledge library view model', phase: 3, isBlocker: true },
  { checkId: 'knowledge_review_queue', label: 'Knowledge review queue', phase: 3, isBlocker: true },
  { checkId: 'knowledge_promotion_path', label: 'Knowledge promotion path', phase: 3, isBlocker: true },
  { checkId: 'knowledge_privacy_guards', label: 'Knowledge privacy guards', phase: 3, isBlocker: true },
  { checkId: 'knowledge_audit_log', label: 'Knowledge audit log', phase: 3, isBlocker: true },
  { checkId: 'ingestion_classifier', label: 'Ingestion classifier', phase: 4, isBlocker: true },
  { checkId: 'voice_ingestion', label: 'Voice ingestion handler', phase: 4, isBlocker: false },
  { checkId: 'source_validator', label: 'Source validator', phase: 4, isBlocker: true },
  { checkId: 'curriculum_bridge', label: 'Knowledge → curriculum bridge', phase: 4, isBlocker: true },
  { checkId: 'retrieval_model', label: 'Knowledge retrieval model', phase: 5, isBlocker: true },
  { checkId: 'curriculum_intelligence', label: 'Knowledge curriculum intelligence', phase: 5, isBlocker: false },
  { checkId: 'answerability_model', label: 'Answerability model', phase: 5, isBlocker: true },
  { checkId: 'knowledge_qa', label: 'Knowledge QA harness', phase: 5, isBlocker: false },
  { checkId: 'curriculum_knowledge_view', label: 'Curriculum knowledge panel view', phase: 5, isBlocker: false },
  { checkId: 'parent_blocked_from_knowledge', label: 'Parent blocked from knowledge library', phase: 0, isBlocker: true },
  { checkId: 'player_blocked_from_knowledge', label: 'Player blocked from knowledge library', phase: 0, isBlocker: true },
  { checkId: 'no_auto_curriculum_promotion', label: 'No auto curriculum promotion', phase: 0, isBlocker: true },
  { checkId: 'director_approval_all_paths', label: 'Director approval on all paths', phase: 0, isBlocker: true },
  { checkId: 'donna_cannot_publish', label: 'DONNA cannot publish', phase: 0, isBlocker: true },
  { checkId: 'coach_cues_private', label: 'Coach cues are coach-only', phase: 0, isBlocker: true },
  { checkId: 'no_new_migrations', label: 'No new DB migrations', phase: 0, isBlocker: true },
  { checkId: 'no_rls_changes', label: 'No RLS changes', phase: 0, isBlocker: true },
  { checkId: 'typescript_clean', label: 'TypeScript clean (npx tsc --noEmit)', phase: 0, isBlocker: true },
]

export function runCurriculumMegaSprintQa(
  passedCheckIds: CurriculumQaCheckId[],
): CurriculumMegaSprintQaReport {
  const passedSet = new Set(passedCheckIds)

  const checks: CurriculumMegaSprintQaResult[] = CURRICULUM_MEGA_SPRINT_QA_CHECKS.map(check => ({
    checkId: check.checkId,
    passed: passedSet.has(check.checkId),
    note: passedSet.has(check.checkId) ? null : `"${check.label}" not confirmed.`,
  }))

  const totalChecks = checks.length
  const passedChecks = checks.filter(c => c.passed).length
  const failedChecks = checks.filter(c => !c.passed).length
  const blockerCheckIds = new Set(CURRICULUM_MEGA_SPRINT_QA_CHECKS.filter(c => c.isBlocker).map(c => c.checkId))
  const blockerFailures = checks.filter(c => !c.passed && blockerCheckIds.has(c.checkId)).length

  const phases: Array<0 | 1 | 2 | 3 | 4 | 5> = [0, 1, 2, 3, 4, 5]
  const byPhase: Record<0 | 1 | 2 | 3 | 4 | 5, { passed: number; total: number }> = {
    0: { passed: 0, total: 0 }, 1: { passed: 0, total: 0 }, 2: { passed: 0, total: 0 },
    3: { passed: 0, total: 0 }, 4: { passed: 0, total: 0 }, 5: { passed: 0, total: 0 },
  }
  for (const check of CURRICULUM_MEGA_SPRINT_QA_CHECKS) {
    const result = checks.find(c => c.checkId === check.checkId)
    if (result) {
      byPhase[check.phase].total += 1
      if (result.passed) byPhase[check.phase].passed += 1
    }
  }

  void phases

  const isComplete = blockerFailures === 0
  const summary = isComplete
    ? `Mega Sprint 503-552 QA: ${passedChecks}/${totalChecks} checks passed. All blockers clear. Curriculum Experience + Knowledge Engine complete.`
    : `Mega Sprint 503-552 QA: ${passedChecks}/${totalChecks} checks passed. ${blockerFailures} blocker${blockerFailures > 1 ? 's' : ''} remain.`

  return { checks, totalChecks, passedChecks, failedChecks, blockerFailures, byPhase, isComplete, summary }
}
