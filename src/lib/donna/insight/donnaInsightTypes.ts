// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Canonical types for the insight framework.
// Input: AcademyMemory[] + MemoryLearningReport (Sprint 1595 + 1625)
// Output: AcademyInsightReport — Blind Spots · Contradictions · Alt Explanations
//         · Perspective Shifts · Opportunities · Confidence · Limitations
//
// Key epistemological distinction (both must be disclosed on every insight):
//   InsightConfidence  = "How certain are we this insight is real?" (signal consistency)
//   EvidenceStrength   = "How much supporting data exists?" (data volume)
//
//   Example — high confidence, weak evidence:
//     "The pattern is clear, but we only have 2 data points."
//   Example — low confidence, strong evidence:
//     "We have many records, but they are mixed and noisy."

// ── Insight type ──────────────────────────────────────────────────────────────

export type InsightType =
  | 'blind_spot'
  | 'contradiction'
  | 'alternative_explanation'
  | 'perspective_shift'
  | 'hidden_opportunity'
  | 'recurring_problem'
  | 'investigation_needed'

// ── Insight confidence ─────────────────────────────────────────────────────────

export type InsightConfidence = 'high' | 'medium' | 'low' | 'insufficient_data'

// ── Evidence strength ──────────────────────────────────────────────────────────

export type EvidenceStrength = 'weak' | 'moderate' | 'strong'

// ── Core insight object ───────────────────────────────────────────────────────

export interface AcademyInsight {
  id:                     string
  insightType:            InsightType
  title:                  string
  summary:                string
  evidence:               string[]
  evidenceStrength:       EvidenceStrength
  confidence:             InsightConfidence
  limitations:            string[]
  recommendation:         string | null
  suggestedInvestigation: string | null
  createdAt:              string
}

// ── Blind spot ────────────────────────────────────────────────────────────────

export type BlindSpotCategory =
  | 'unresolved_bottleneck'
  | 'ignored_recommendation'
  | 'approval_delay'
  | 'missing_assessment'
  | 'parent_communication_gap'
  | 'promotion_blocker'
  | 'placement_issue'
  | 'coach_overload'

export interface BlindSpot {
  id:                     string
  category:               BlindSpotCategory
  headline:               string
  evidence:               string[]
  evidenceStrength:       EvidenceStrength
  confidence:             InsightConfidence
  suggestedInvestigation: string
  limitations:            string[]
}

// ── Contradiction ─────────────────────────────────────────────────────────────

export interface Contradiction {
  id:                string
  headline:          string
  observedBehavior:  string
  conflictingSignal: string
  evidence:          string[]
  evidenceStrength:  EvidenceStrength
  confidence:        InsightConfidence
  suggestedReview:   string
  limitations:       string[]
}

// ── Alternative explanation ───────────────────────────────────────────────────

export interface AlternativeExplanation {
  id:               string
  observedIssue:    string
  explanationA:     string
  explanationB:     string
  explanationC:     string | null
  evidence:         string[]
  evidenceStrength: EvidenceStrength
  confidence:       InsightConfidence
  limitations:      string[]
}

// ── Perspective shift ─────────────────────────────────────────────────────────

export interface PerspectiveShift {
  id:                     string
  currentPerspective:     string
  alternativePerspective: string
  evidence:               string[]
  evidenceStrength:       EvidenceStrength
  confidence:             InsightConfidence
  suggestedInvestigation: string
  limitations:            string[]
}

// ── Hidden opportunity ────────────────────────────────────────────────────────

export interface HiddenOpportunity {
  id:               string
  headline:         string
  observation:      string
  evidence:         string[]
  evidenceStrength: EvidenceStrength
  confidence:       InsightConfidence
  suggestedAction:  string
  limitations:      string[]
}

// ── Academy insight report ────────────────────────────────────────────────────

export interface AcademyInsightReport {
  generatedAt:             string
  totalMemoriesAnalyzed:   number
  topInsights:             AcademyInsight[]          // max 3 — highest-priority across categories
  blindSpots:              BlindSpot[]
  contradictions:          Contradiction[]
  alternativeExplanations: AlternativeExplanation[]
  perspectiveShifts:       PerspectiveShift[]
  hiddenOpportunities:     HiddenOpportunity[]       // max 3
  topInvestigations:       string[]                  // max 3 suggested investigation actions
  confidence:              InsightConfidence
  limitations:             string[]
}
