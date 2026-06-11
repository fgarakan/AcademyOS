// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Operational Input Contract: current academy operational state.
//
// Every domain must declare dataAvailable and missingData.
// If data is missing, DONNA must say so — never infer unavailable state.
//
// Sources: DirectorDonnaContext, DB queries, pre-loaded operational signals.
// This contract is populated by buildOperatingPartnerOperationalInputs()
// in buildOperatingPartnerInputs.ts.
//
// IMPORTANT: This contract is distinct from the philosophy contract.
// Philosophy = who we are over time.
// Operations = what is happening right now.

// ── Shared domain base ────────────────────────────────────────────────────────

export interface OperationalDomainBase {
  /** True only when real data was loaded for this domain. */
  dataAvailable: boolean
  /** Specific fields or tables that could not be loaded. */
  missingData:   string[]
}

// ── Player operational state ──────────────────────────────────────────────────

export interface PlayerOperationalInput extends OperationalDomainBase {
  totalPlayerCount:         number   // active players in the academy
  levelDistribution:        Array<{ levelName: string; playerCount: number }>
  stallCount:               number   // players with no progression in recent sessions
  assessmentDueCount:       number   // players due for assessment or reassessment
  advancementEligibleCount: number   // players currently eligible for level advancement
  attendanceRiskCount:      number   // players with attendance rate < threshold
  readinessBlockerCount:    number   // players blocked from advancement by missing evidence
  playersWithoutLevel:      number   // placed but no level assigned
  playersWithoutCoach:      number   // no primary coach assigned
  // Presence flags — for domains where counts are 0, flag helps distinguish
  // "zero because data loaded and found none" from "zero because unavailable"
  hasStallData:             boolean
  hasAssessmentData:        boolean
  hasAttendanceData:        boolean
}

// ── Coach operational state ───────────────────────────────────────────────────

export interface CoachOperationalInput extends OperationalDomainBase {
  totalCoachCount:           number
  missingWrapUpCount:        number   // sessions without a coach recap submitted
  missingWrapUpCoachCount:   number   // distinct coaches with missing wrap-ups
  inconsistentExecutionCount: number  // coaches with high deviation from curriculum plan
  stagnantPlayerByCoachCount: number  // coaches with multiple stalled players assigned
  recentWrapUpSubmissionRate: number  // 0–1; lower = coaches falling behind
  hasWrapUpData:             boolean
  hasExecutionData:          boolean
}

// ── Curriculum operational state ──────────────────────────────────────────────

export interface CurriculumOperationalInput extends OperationalDomainBase {
  weakLevelCount:            number   // levels with fewer than 3 academy-owned items
  emptyLevelCount:           number   // levels with no academy-owned content at all
  missingAssessmentCount:    number   // levels with no assessment or success criteria items
  missingGateCount:          number   // advancement gates that are undefined
  contentGapsByType:         Record<string, number>  // contentType → deficit count
  bottleneckLevelCount:      number   // levels blocking player advancement
  pendingApprovalCount:      number   // curriculum changes awaiting director approval
  playerBackedBottleneckCount: number // levels with player evidence of bottleneck
  hasCurriculumData:         boolean
  hasGateData:               boolean
  hasPlayerEvidenceData:     boolean
}

// ── Parent operational state ──────────────────────────────────────────────────

export interface ParentOperationalInput extends OperationalDomainBase {
  totalParentCount:          number
  communicationGapCount:     number   // parents with no recent update
  updateOverdueCount:        number   // updates past the academy's transparency threshold
  engagementRiskCount:       number   // parents showing low engagement signals
  retentionRiskCount:        number   // parents with combined low engagement + player stall
  transparencyLevel:         'high' | 'standard' | 'minimal'  // from academy DNA
  hasCommunicationData:      boolean
  hasEngagementData:         boolean
  hasRetentionData:          boolean
}

// ── Business operational state ────────────────────────────────────────────────

export interface BusinessOperationalInput extends OperationalDomainBase {
  enrollmentTrendSignal:     'growing' | 'stable' | 'declining' | 'unknown'
  capacityIssueCount:        number   // groups/sessions at or over capacity
  programImbalanceSignal:    string | null  // e.g. "Red Ball 1 overcrowded, Green Ball sparse"
  attendanceTrendLast30Days: 'improving' | 'stable' | 'declining' | 'unknown'
  churnRiskSignal:           'low' | 'medium' | 'high' | 'unknown'
  revenueSignal:             'available' | 'unavailable'  // V1: unavailable
  hasEnrollmentData:         boolean
  hasCapacityData:           boolean
}

// ── System operational state ──────────────────────────────────────────────────

export interface SystemOperationalInput extends OperationalDomainBase {
  pendingApprovalCount:      number   // proposed_actions awaiting director decision
  oldestPendingAgeDays:      number | null  // null when queue is empty
  onboardingIncompleteItems: string[]       // e.g. ['academy_dna', 'first_player']
  unreadAlertCount:          number
  hasLiveData:               boolean   // true = real DB, false = demo/seed data
  isAcademyLive:             boolean   // true = past initial setup phase
}

// ── Combined operational inputs ───────────────────────────────────────────────

export interface OperatingPartnerOperationalInputs {
  players:    PlayerOperationalInput
  coaches:    CoachOperationalInput
  curriculum: CurriculumOperationalInput
  parents:    ParentOperationalInput
  business:   BusinessOperationalInput
  system:     SystemOperationalInput

  // Metadata
  generatedAt:    string   // ISO timestamp
  academyId:      string
  dataWindowDays: number   // how many days of history were queried
}
