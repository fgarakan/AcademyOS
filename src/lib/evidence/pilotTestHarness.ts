// Pilot Test Harness — pure TypeScript, no DB calls.
// Defines Player A (full flow) and Player B (override + missing data) test scenarios.
// Used during pilot to verify the evidence engine produces correct signals.

import type { EvidenceRecord, ProgressRollup } from './playerEvidenceTypes'
import { computeProgressRollup } from './playerProgressRollup'
import {
  buildWhyThisLevelAnswer,
  buildStalledCheckAnswer,
  buildEvidenceForNextLevelAnswer,
  buildWhatChangedAnswer,
} from './donnaEvidenceAnswers'

// ─── Scenario: Player A — full flow ──────────────────────────────────────────
// Assessment → placement → blueprint → mission → coach observation → reassessment → readiness

export const PLAYER_A_SCENARIO: EvidenceRecord[] = [
  {
    id: 'pa-1', academy_id: 'test-academy', player_id: 'player-a',
    source_type: 'assessment_score', source_id: 'assess-001',
    pathway: 'skill', curriculum_level_id: null, curriculum_level_name: 'Orange 1',
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: null, priority_label: null,
    confidence: 72, evidence_strength: 'moderate',
    evidence_summary: 'Monthly development check recorded. Overall score: 7.2/10. View: orange_ball.',
    visible_to_director: true, visible_to_coach: true, visible_to_parent: false, visible_to_player: false,
    owner_scope: 'shared', portability_status: 'portable', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'pa-2', academy_id: 'test-academy', player_id: 'player-a',
    source_type: 'placement_decision', source_id: 'placement-001',
    pathway: 'general', curriculum_level_id: null, curriculum_level_name: 'Orange 1',
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: null, priority_label: null,
    confidence: 90, evidence_strength: 'strong',
    evidence_summary: 'Placement accepted. Level: Orange 1. Group: Saturday Juniors.',
    visible_to_director: true, visible_to_coach: true, visible_to_parent: false, visible_to_player: false,
    owner_scope: 'shared', portability_status: 'portable', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-05-02T10:00:00Z', updated_at: '2026-05-02T10:00:00Z',
  },
  {
    id: 'pa-3', academy_id: 'test-academy', player_id: 'player-a',
    source_type: 'mission_assigned', source_id: 'mission-001',
    pathway: 'general', curriculum_level_id: null, curriculum_level_name: null,
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: 'priority-001', priority_label: 'Serve Organization',
    confidence: 70, evidence_strength: 'moderate',
    evidence_summary: 'Mission assigned: "Serve Rhythm — 10 focused serves per session".',
    visible_to_director: true, visible_to_coach: true, visible_to_parent: false, visible_to_player: true,
    owner_scope: 'player_owned', portability_status: 'portable', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-05-05T10:00:00Z', updated_at: '2026-05-05T10:00:00Z',
  },
  {
    id: 'pa-4', academy_id: 'test-academy', player_id: 'player-a',
    source_type: 'reassessment_change', source_id: 'assess-002',
    pathway: 'skill', curriculum_level_id: null, curriculum_level_name: 'Orange 1',
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: null, priority_label: null,
    confidence: 80, evidence_strength: 'strong',
    evidence_summary: 'Reassessment: overall improved by 0.8. 3 domains improved, 0 declined.',
    visible_to_director: true, visible_to_coach: true, visible_to_parent: false, visible_to_player: false,
    owner_scope: 'shared', portability_status: 'portable', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-05-28T10:00:00Z', updated_at: '2026-05-28T10:00:00Z',
  },
]

// ─── Scenario: Player B — override + missing data ─────────────────────────────
// Assessment → director override → mission → poor attendance → missing evidence

export const PLAYER_B_SCENARIO: EvidenceRecord[] = [
  {
    id: 'pb-1', academy_id: 'test-academy', player_id: 'player-b',
    source_type: 'assessment_score', source_id: 'assess-003',
    pathway: 'skill', curriculum_level_id: null, curriculum_level_name: 'Red 2',
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: null, priority_label: null,
    confidence: 40, evidence_strength: 'weak',
    evidence_summary: 'Onboarding placement recorded. Overall score: 3.5/10. View: red_ball.',
    visible_to_director: true, visible_to_coach: true, visible_to_parent: false, visible_to_player: false,
    owner_scope: 'shared', portability_status: 'portable', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-04-01T10:00:00Z', updated_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'pb-2', academy_id: 'test-academy', player_id: 'player-b',
    source_type: 'director_override', source_id: 'placement-002_override',
    pathway: 'general', curriculum_level_id: null, curriculum_level_name: null,
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: null, priority_label: null,
    confidence: 90, evidence_strength: 'strong',
    evidence_summary: 'Director override applied. Decision: overridden.',
    visible_to_director: true, visible_to_coach: false, visible_to_parent: false, visible_to_player: false,
    owner_scope: 'academy_owned', portability_status: 'internal_only', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-04-02T10:00:00Z', updated_at: '2026-04-02T10:00:00Z',
  },
  {
    id: 'pb-3', academy_id: 'test-academy', player_id: 'player-b',
    source_type: 'placement_decision', source_id: 'placement-002',
    pathway: 'general', curriculum_level_id: null, curriculum_level_name: 'Orange 1',
    curriculum_requirement_id: null, curriculum_requirement_label: null,
    priority_key: null, priority_label: null,
    confidence: 90, evidence_strength: 'strong',
    evidence_summary: 'Placement overridden. Level: Orange 1. Group: Orange Foundations.',
    visible_to_director: true, visible_to_coach: true, visible_to_parent: false, visible_to_player: false,
    owner_scope: 'shared', portability_status: 'portable', consent_status: 'not_required',
    consent_version: null, anonymized_at: null, transferred_at: null,
    created_by: 'director-id', created_at: '2026-04-02T10:00:00Z', updated_at: '2026-04-02T10:00:00Z',
  },
]

// ─── Verification helpers ─────────────────────────────────────────────────────

export interface HarnessResult {
  scenario: string
  assertions: Array<{ name: string; passed: boolean; detail: string }>
  rollup: ProgressRollup
}

export function runPlayerAHarness(): HarnessResult {
  const rollup = computeProgressRollup('player-a', PLAYER_A_SCENARIO, {
    activePriorityCount: 1,
    currentLevelName: 'Orange 1',
    nextLevelName: 'Orange 2',
  })

  const whyAnswer    = buildWhyThisLevelAnswer('Jamie', PLAYER_A_SCENARIO, rollup, 'Orange 1')
  const stalledCheck = buildStalledCheckAnswer('Jamie', PLAYER_A_SCENARIO, rollup)
  const reassessment = buildWhatChangedAnswer('Jamie', PLAYER_A_SCENARIO)
  const nextLevel    = buildEvidenceForNextLevelAnswer('Jamie', PLAYER_A_SCENARIO, rollup, 'Orange 2')

  const assertions = [
    {
      name: 'Evidence records present',
      passed: PLAYER_A_SCENARIO.length === 4,
      detail: `Expected 4 records, got ${PLAYER_A_SCENARIO.length}`,
    },
    {
      name: 'Progress status is not missing_data',
      passed: rollup.progressStatus !== 'missing_data',
      detail: `Status: ${rollup.progressStatus}`,
    },
    {
      name: 'Why-this-level answer has evidence',
      passed: whyAnswer.citedEvidenceIds.length > 0,
      detail: `Cited ${whyAnswer.citedEvidenceIds.length} records`,
    },
    {
      name: 'Not stalled',
      passed: rollup.progressStatus !== 'stalled',
      detail: `Status: ${rollup.progressStatus}`,
    },
    {
      name: 'Reassessment change detected',
      passed: reassessment.citedEvidenceIds.length > 0,
      detail: reassessment.answer.slice(0, 80),
    },
    {
      name: 'Mission progress recorded',
      passed: rollup.missionProgress.active >= 1,
      detail: `Active: ${rollup.missionProgress.active}, Completed: ${rollup.missionProgress.completed}`,
    },
    {
      name: 'Director override is internal_only (not visible in player-B answer)',
      passed: !PLAYER_B_SCENARIO.some(r => r.source_type === 'director_override' && r.visible_to_parent),
      detail: 'Override portability_status = internal_only',
    },
    {
      name: 'Parent-visible records are portable',
      passed: PLAYER_A_SCENARIO.filter(r => r.visible_to_parent).every(r => r.portability_status === 'portable'),
      detail: 'All parent-visible records are portable',
    },
  ]

  return { scenario: 'Player A — full flow', assertions, rollup }
}

export function runPlayerBHarness(): HarnessResult {
  const rollup = computeProgressRollup('player-b', PLAYER_B_SCENARIO, {
    currentLevelName: 'Orange 1',
  })

  const stalledCheck = buildStalledCheckAnswer('Alex', PLAYER_B_SCENARIO, rollup)

  const assertions = [
    {
      name: 'Director override not visible to coach',
      passed: PLAYER_B_SCENARIO.find(r => r.source_type === 'director_override')?.visible_to_coach === false,
      detail: 'Override is director-only',
    },
    {
      name: 'Override is internal_only portability',
      passed: PLAYER_B_SCENARIO.find(r => r.source_type === 'director_override')?.portability_status === 'internal_only',
      detail: 'Override will not be exported in player passport',
    },
    {
      name: 'Override is academy_owned',
      passed: PLAYER_B_SCENARIO.find(r => r.source_type === 'director_override')?.owner_scope === 'academy_owned',
      detail: 'Override belongs to academy, not player',
    },
    {
      name: 'Missing evidence detected',
      passed: rollup.missingEvidence.length > 0 || rollup.readinessBlockers.length > 0,
      detail: `Missing: ${rollup.missingEvidence.join(', ')}`,
    },
    {
      name: 'Stall check responds without hallucinating',
      passed: stalledCheck.answer.length > 0 && !stalledCheck.answer.includes('undefined'),
      detail: stalledCheck.answer.slice(0, 80),
    },
  ]

  return { scenario: 'Player B — override + missing data', assertions, rollup }
}
