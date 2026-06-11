// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Output Contract: what Sprint 1776–1805 is responsible for producing.
//
// Hard limits enforced here and in certification:
//   - Maximum 3 priorities (DirectorOperatingBrief.priorities)
//   - Maximum 3 alerts  (DirectorOperatingBrief.alerts)
//   - Maximum 3 wins    (DirectorOperatingBrief.wins)
//   - Exactly 1 primary action (DirectorOperatingBrief.primaryAction)
//
// These limits exist because more than 3 items of any type creates cognitive
// overload and reduces the probability that the director acts on any of them.
//
// IMPORTANT: These outputs are NOT the same as:
//   - AcademyAttentionReport (from academyAttentionEngine.ts) — operational attention
//   - DirectorPriority[] (from directorPriorityEngine.ts) — today's session priorities
//   - AcademyIntelligenceReport (from academyIntelligenceEngine.ts) — observation log
// The Operating Partner produces a SYNTHESISED output that fuses philosophy +
// operational intelligence into a strategic-level brief. It does not replace
// the operational engines — it reads from them and adds the philosophy dimension.

// ── Situation types ───────────────────────────────────────────────────────────

export type SituationType =
  | 'player_progression_bottleneck'  // players stalled; curriculum or placement issue
  | 'coach_execution_gap'            // coaches missing recaps; inconsistent delivery
  | 'curriculum_gap'                 // curriculum missing content; gates undefined
  | 'parent_retention_risk'          // parent engagement declining; communication gaps
  | 'business_capacity_issue'        // enrollment / capacity imbalance
  | 'philosophy_drift'               // stated DNA vs. observed behavior diverging HIGH
  | 'opportunity_to_double_down'     // strong positive momentum; reinforce now
  | 'assessment_debt'                // assessment completion falling behind players
  | 'communication_gap'              // director not responding to alerts or approvals
  | 'unclear_cause_requires_review'  // signals present but data gaps too large to classify

export type SituationSeverity = 'critical' | 'high' | 'medium' | 'low'

export type SituationDomain =
  | 'players' | 'coaches' | 'curriculum' | 'parents'
  | 'business' | 'system' | 'philosophy' | 'cross_domain'

// ── Situation assessment ──────────────────────────────────────────────────────

export interface AcademySituationAssessment {
  situationType:     SituationType
  severity:          SituationSeverity
  confidence:        'reliable' | 'provisional'
  affectedDomains:   SituationDomain[]
  evidenceSummary:   string    // 1–2 sentences: what the data shows
  likelyCause:       string    // DONNA's reasoned interpretation (not assertion)
  missingData:       string[]  // what would change or sharpen this assessment
  recommendedDirection: string // the broad direction, not a specific action
}

// ── Attention score ───────────────────────────────────────────────────────────
// Per-domain urgency scores 0–100.

export interface AcademyAttentionScore {
  overall:         number   // 0–100 composite
  players:         number
  coaches:         number
  curriculum:      number
  parents:         number
  business:        number
  system:          number
  whatRaisedScore: string[]  // top signals that elevated the score
  whatLoweredScore: string[] // signals that are in good shape
  missingData:     string[]  // domains where score is a floor estimate due to gaps
}

// ── Operating priority ────────────────────────────────────────────────────────
// Max 3 in any DirectorOperatingBrief.

export type PriorityUrgency = 'immediate' | 'this_week' | 'this_month'
export type PriorityDomain  = SituationDomain
export type ExpectedImpact  = 'high' | 'medium' | 'low'

export interface OperatingPriority {
  rank:              number    // 1 = highest. Always 1, 2, or 3.
  title:             string    // action-oriented title
  domain:            PriorityDomain
  urgency:           PriorityUrgency
  expectedImpact:    ExpectedImpact
  confidence:        'reliable' | 'provisional'
  timeEstimate:      string    // e.g. '15 minutes', '1 session review'
  firstStep:         string    // the specific first action, ready to show to director
  approvalRequired:  boolean   // true = director must confirm before DONNA acts
  evidenceUsed:      string[]  // which signals drove this priority
  missingData:       string[]  // what would sharpen this priority
  reason:            string    // why this is ranked above other items
}

// ── Win (positive signal) ─────────────────────────────────────────────────────
// Max 3 in any DirectorOperatingBrief.

export interface OperatingWin {
  rank:        number   // 1–3
  headline:    string
  domain:      PriorityDomain
  evidence:    string   // what the data actually shows
  confidence:  'reliable' | 'provisional'
}

// ── Alert ─────────────────────────────────────────────────────────────────────
// Max 3 in any DirectorOperatingBrief.

export interface OperatingAlert {
  rank:              number   // 1–3
  headline:          string
  domain:            PriorityDomain
  severity:          SituationSeverity
  evidence:          string
  recommendedAction: string
  confidence:        'reliable' | 'provisional'
}

// ── Director operating brief ──────────────────────────────────────────────────
// The primary output of the Operating Partner.
// Hard limits: max 3 priorities, max 3 alerts, max 3 wins, exactly 1 primary action.

export interface DirectorOperatingBrief {
  priorities:    OperatingPriority[]   // max 3
  alerts:        OperatingAlert[]      // max 3
  wins:          OperatingWin[]        // max 3
  primaryAction: OperatingPriority     // the single most important action right now
  whatToIgnore:  string                // what DONNA is explicitly deprioritising today
  generatedAt:   string
  confidence:    'reliable' | 'provisional'
  // True when philosophy and operations data are both loaded.
  // False = operating in partial-data mode; brief may be incomplete.
  isComplete:    boolean
}

// ── COO conversation answer ───────────────────────────────────────────────────
// Used when director asks DONNA a direct strategic question.

export interface COOConversationAnswer {
  question:            string   // the question asked
  answer:              string   // DONNA's answer
  evidenceUsed:        string[] // signals that informed this answer
  confidence:          'reliable' | 'provisional'
  missingData:         string[] // what would improve the answer
  recommendedNextAction: string | null
}
