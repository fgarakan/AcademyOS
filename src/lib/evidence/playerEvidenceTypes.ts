// Player Evidence Engine — core types
// player_evidence_records is the source of truth for DONNA, rollup, missions, blueprints, parent summaries.

// ─── Source types ─────────────────────────────────────────────────────────────

export type EvidenceSourceType =
  | 'assessment_score'
  | 'reassessment_change'
  | 'coach_observation'
  | 'mission_assigned'
  | 'mission_completed'
  | 'session_attendance'
  | 'session_actual'
  | 'placement_decision'
  | 'director_override'
  | 'level_readiness_signal'
  | 'parent_update_approved'
  | 'competition_note'
  | 'fitness_note'
  | 'mental_performance_note'

export type EvidencePathway =
  | 'skill'
  | 'competition'
  | 'fitness'
  | 'mental_performance'
  | 'general'

export type EvidenceStrength = 'strong' | 'moderate' | 'weak'

// ─── Ownership + portability ──────────────────────────────────────────────────

export type OwnerScope =
  | 'player_owned'   // assessment outcomes, level progress, missions, approved summaries
  | 'academy_owned'  // raw observations, attendance, operational data
  | 'shared'         // placement decisions, level placements, development priorities

export type PortabilityStatus =
  | 'portable'           // included in player passport on exit (with consent)
  | 'internal_only'      // never exported — raw coach notes, internal overrides
  | 'anonymized_on_exit' // player_id detached; retained for program analytics

export type ConsentStatus =
  | 'pending'
  | 'granted'
  | 'revoked'
  | 'not_required'

// ─── Evidence record (matches player_evidence_records table) ─────────────────

export interface EvidenceRecord {
  id: string
  academy_id: string
  // Nullable: set to null when player exits and record is anonymized (ON DELETE SET NULL)
  player_id: string | null

  source_type: EvidenceSourceType
  source_id: string | null

  curriculum_level_id: string | null
  curriculum_level_name: string | null
  curriculum_requirement_id: string | null
  curriculum_requirement_label: string | null

  priority_key: string | null
  priority_label: string | null

  pathway: EvidencePathway | null
  // Orthogonal to pathway/source_type — e.g. 'assessment' | 'observation' | 'milestone'
  evidence_category: string | null
  confidence: number
  evidence_strength: EvidenceStrength
  // Relative weight for rollup calculations (default 1.0)
  evidence_weight: number
  evidence_summary: string

  visible_to_director: boolean
  visible_to_coach: boolean
  visible_to_parent: boolean
  visible_to_player: boolean

  owner_scope: OwnerScope
  portability_status: PortabilityStatus
  consent_status: ConsentStatus
  consent_version: string | null

  // Player Passport / anonymization fields
  anonymized_player_key: string | null
  former_player_stage: string | null
  former_player_age_band: string | null

  anonymized_at: string | null
  transferred_at: string | null
  expires_at: string | null

  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── Write input (subset used by writer) ─────────────────────────────────────

export interface EvidenceWriteInput {
  academyId: string
  playerId: string
  sourceType: EvidenceSourceType
  sourceId: string
  pathway?: EvidencePathway
  curriculumLevelId?: string | null
  curriculumLevelName?: string | null
  curriculumRequirementId?: string | null
  curriculumRequirementLabel?: string | null
  priorityKey?: string | null
  priorityLabel?: string | null
  confidence?: number
  evidenceStrength?: EvidenceStrength
  evidenceSummary: string
  visibleToCoach?: boolean
  visibleToParent?: boolean
  visibleToPlayer?: boolean
  createdBy?: string | null
}

// ─── Ownership defaults per source type ──────────────────────────────────────

export const EVIDENCE_OWNERSHIP: Record<EvidenceSourceType, {
  ownerScope: OwnerScope
  portabilityStatus: PortabilityStatus
  consentStatus: ConsentStatus
  defaultVisibleToCoach: boolean
  defaultVisibleToParent: boolean
  defaultVisibleToPlayer: boolean
}> = {
  assessment_score: {
    ownerScope: 'shared',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  reassessment_change: {
    ownerScope: 'shared',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  coach_observation: {
    ownerScope: 'academy_owned',
    portabilityStatus: 'internal_only',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  mission_assigned: {
    ownerScope: 'player_owned',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: true,
  },
  mission_completed: {
    ownerScope: 'player_owned',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: true,
  },
  session_attendance: {
    ownerScope: 'academy_owned',
    portabilityStatus: 'anonymized_on_exit',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  session_actual: {
    ownerScope: 'academy_owned',
    portabilityStatus: 'anonymized_on_exit',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  placement_decision: {
    ownerScope: 'shared',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  director_override: {
    ownerScope: 'academy_owned',
    portabilityStatus: 'internal_only',
    consentStatus: 'not_required',
    defaultVisibleToCoach: false,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  level_readiness_signal: {
    ownerScope: 'shared',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  parent_update_approved: {
    ownerScope: 'player_owned',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: false,
    defaultVisibleToParent: true,
    defaultVisibleToPlayer: false,
  },
  competition_note: {
    ownerScope: 'shared',
    portabilityStatus: 'portable',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  fitness_note: {
    ownerScope: 'academy_owned',
    portabilityStatus: 'anonymized_on_exit',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
  mental_performance_note: {
    ownerScope: 'academy_owned',
    portabilityStatus: 'internal_only',
    consentStatus: 'not_required',
    defaultVisibleToCoach: true,
    defaultVisibleToParent: false,
    defaultVisibleToPlayer: false,
  },
}

// ─── Progress rollup types ────────────────────────────────────────────────────

export type ProgressStatus =
  | 'on_track'
  | 'needs_attention'
  | 'ready_for_review'
  | 'missing_data'
  | 'stalled'

export interface PathwaySignal {
  pathway: EvidencePathway
  label: string
  strongestArea: string | null
  weakestArea: string | null
  recentImprovement: string | null
  recentDecline: string | null
  evidenceCount: number
  latestDate: string | null
}

export interface ReadinessBlocker {
  blockerType: 'missing_assessment' | 'missing_evidence' | 'mission_incomplete' | 'attendance_gap' | 'stalled'
  description: string
  pathway: EvidencePathway | null
  severity: 'high' | 'medium' | 'low'
}

export interface ProgressRollup {
  playerId: string
  computedAt: string
  progressStatus: ProgressStatus
  activePriorityCount: number
  pathwaySignals: PathwaySignal[]
  readinessBlockers: ReadinessBlocker[]
  assessmentFreshnessDays: number | null
  observationFreshnessDays: number | null
  attendanceConsistency: 'consistent' | 'inconsistent' | 'missing' | 'unknown'
  parentUpdateFreshnessDays: number | null
  missionProgress: {
    active: number
    completed: number
    pending: number
  }
  donnaSummary: string
  recommendedNextAction: string
  missingEvidence: string[]
  totalEvidenceCount: number
}

// ─── DONNA evidence answer ────────────────────────────────────────────────────

export interface EvidenceAnswer {
  intent: string
  answer: string
  citedEvidenceIds: string[]
  missingEvidenceNote: string | null
  confidence: number
  isSafe: boolean
  safeForParent: boolean
  safeForPlayer: boolean
}

// ─── Parent/player safe summary ──────────────────────────────────────────────

export interface ParentSafeSummary {
  currentFocus: string | null
  whyItMatters: string | null
  recentProgress: string | null
  whatHelpsAtHome: string | null
  nextCheckIn: string | null
  generatedFrom: string[]
}

export interface PlayerSafeSummary {
  mission: string | null
  progress: string | null
  encouragement: string
  nextAction: string | null
  generatedFrom: string[]
}
